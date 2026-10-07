<?php
/**
 * Product post type + category taxonomy, with the term fields (gender,
 * sort order) and admin list columns that make wp-admin a real catalog
 * manager rather than a bare post list.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function bc_register_post_types() {
	register_post_type(
		'bc_product',
		array(
			'labels'       => array(
				'name'               => __( 'Products', 'baig-cloth-headless' ),
				'singular_name'      => __( 'Product', 'baig-cloth-headless' ),
				'add_new'            => __( 'Add Product', 'baig-cloth-headless' ),
				'add_new_item'       => __( 'Add New Product', 'baig-cloth-headless' ),
				'edit_item'          => __( 'Edit Product', 'baig-cloth-headless' ),
				'new_item'           => __( 'New Product', 'baig-cloth-headless' ),
				'view_item'          => __( 'View Product', 'baig-cloth-headless' ),
				'search_items'       => __( 'Search Products', 'baig-cloth-headless' ),
				'not_found'          => __( 'No products found', 'baig-cloth-headless' ),
				'not_found_in_trash' => __( 'No products in Trash', 'baig-cloth-headless' ),
			),
			// Headless: no public pages on the WordPress side — the React
			// storefront is the only public face. show_ui keeps wp-admin.
			'public'       => false,
			'show_ui'      => true,
			'show_in_menu' => true,
			'menu_icon'    => 'dashicons-tag',
			'supports'     => array( 'title', 'editor' ),
			'show_in_rest' => false, // custom /baig/v1 API instead; keeps the classic editor for the metabox flow.
		)
	);

	register_taxonomy(
		'bc_category',
		'bc_product',
		array(
			'labels'            => array(
				'name'          => __( 'Categories', 'baig-cloth-headless' ),
				'singular_name' => __( 'Category', 'baig-cloth-headless' ),
				'add_new_item'  => __( 'Add New Category', 'baig-cloth-headless' ),
				'edit_item'     => __( 'Edit Category', 'baig-cloth-headless' ),
			),
			// Hierarchical gives the checkbox-style admin UI (no free-tagging),
			// but the storefront model is flat — one category per product,
			// enforced by the single-select metabox below.
			'hierarchical'      => true,
			'public'            => false,
			'show_ui'           => true,
			'show_admin_column' => false, // we render our own column with gender.
			// Quick Edit / Bulk Edit render a checkbox list for hierarchical
			// taxonomies, which would let a product end up with two categories
			// or none. The edit-screen dropdown is the single-category path.
			'show_in_quick_edit' => false,
			'show_in_rest'      => false,
			'meta_box_cb'       => 'bc_category_meta_box',
		)
	);
}
add_action( 'init', 'bc_register_post_types' );

/**
 * Single-select category dropdown replacing the default checkbox metabox —
 * the catalog model is exactly one category per product.
 */
function bc_category_meta_box( $post ) {
	$terms    = get_terms(
		array(
			'taxonomy'   => 'bc_category',
			'hide_empty' => false,
		)
	);
	$current  = wp_get_object_terms( $post->ID, 'bc_category', array( 'fields' => 'ids' ) );
	$selected = ( ! is_wp_error( $current ) && $current ) ? (int) $current[0] : 0;

	wp_nonce_field( 'bc_save_category', 'bc_category_nonce' );

	if ( is_wp_error( $terms ) || empty( $terms ) ) {
		echo '<p>' . esc_html__( 'No categories yet — add one under Products → Categories first.', 'baig-cloth-headless' ) . '</p>';
		return;
	}

	echo '<select name="bc_category_term" id="bc_category_term" style="width:100%">';
	// An explicit blank choice: without it the browser preselects the first
	// category and a forgotten category silently becomes a wrong one.
	printf(
		'<option value="0" %s>%s</option>',
		selected( $selected, 0, false ),
		esc_html__( '— Select a category —', 'baig-cloth-headless' )
	);
	foreach ( $terms as $term ) {
		$gender = get_term_meta( $term->term_id, 'bc_gender', true );
		printf(
			'<option value="%d" %s>%s (%s)</option>',
			(int) $term->term_id,
			selected( $selected, $term->term_id, false ),
			esc_html( $term->name ),
			esc_html( $gender ? $gender : '—' )
		);
	}
	echo '</select>';
	echo '<p class="description">' . esc_html__( 'Required to publish. Each product belongs to exactly one category.', 'baig-cloth-headless' ) . '</p>';
}

function bc_save_category_metabox( $post_id, $post ) {
	if ( 'bc_product' !== $post->post_type ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( ! isset( $_POST['bc_category_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['bc_category_nonce'] ), 'bc_save_category' ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	if ( ! isset( $_POST['bc_category_term'] ) ) {
		return;
	}

	$term_id = absint( $_POST['bc_category_term'] );
	$term    = get_term( $term_id, 'bc_category' );
	if ( $term && ! is_wp_error( $term ) ) {
		wp_set_object_terms( $post_id, array( (int) $term->term_id ), 'bc_category', false );
	}
}
add_action( 'save_post', 'bc_save_category_metabox', 10, 2 );

/**
 * Refuse to delete a category that still has products — the original API
 * answered DELETE /categories/{id} with a 400 in exactly this case. Without
 * the guard, WordPress drops the term relationships and the products silently
 * disappear from every storefront listing.
 *
 * pre_delete_term has no "cancel" return value, so wp_die() is the only way
 * to stop the delete (wp-admin shows it as an error page with a back link;
 * the inline AJAX delete surfaces the same message).
 */
function bc_block_deleting_used_category( $term_id, $taxonomy ) {
	if ( 'bc_category' !== $taxonomy ) {
		return;
	}
	$used = get_posts(
		array(
			'post_type'      => 'bc_product',
			'post_status'    => array( 'publish', 'draft', 'pending', 'private', 'future' ),
			'posts_per_page' => 1,
			'fields'         => 'ids',
			'no_found_rows'  => true,
			'tax_query'      => array( // phpcs:ignore WordPress.DB.SlowDBQuery
				array(
					'taxonomy'         => 'bc_category',
					'field'            => 'term_id',
					'terms'            => array( (int) $term_id ),
					'include_children' => false,
				),
			),
		)
	);
	if ( $used ) {
		wp_die(
			esc_html__( 'Cannot delete a category that still has products. Reassign or delete them first.', 'baig-cloth-headless' ),
			esc_html__( 'Category in use', 'baig-cloth-headless' ),
			array(
				'response'  => 400,
				'back_link' => true,
			)
		);
	}
}
add_action( 'pre_delete_term', 'bc_block_deleting_used_category', 10, 2 );

/**
 * Category names repeat across genders ("Cotton" for men and for women), but
 * WordPress refuses a second hierarchical term with the same name under the
 * same parent unless it is given a distinct slug — and the Add Category form
 * leaves the slug blank. Fill it in from gender + name so the owner can just
 * add "Cotton" for the other side. Runs on admin_init so it covers both the
 * AJAX add-tag request and the plain form post; core verifies the nonce later.
 */
function bc_default_category_slug() {
	if ( empty( $_POST['action'] ) || 'add-tag' !== $_POST['action'] ) {
		return;
	}
	if ( empty( $_POST['taxonomy'] ) || 'bc_category' !== $_POST['taxonomy'] ) {
		return;
	}
	if ( ! empty( $_POST['slug'] ) || empty( $_POST['tag-name'] ) || empty( $_POST['bc_gender'] ) ) {
		return;
	}
	$gender = sanitize_key( wp_unslash( $_POST['bc_gender'] ) );
	if ( ! in_array( $gender, array( 'men', 'women' ), true ) ) {
		return;
	}
	$_POST['slug'] = sanitize_title( $gender . '-' . wp_unslash( $_POST['tag-name'] ) );
}
add_action( 'admin_init', 'bc_default_category_slug' );

// ---------------------------------------------------------------------------
// Term fields: gender + sort order
// ---------------------------------------------------------------------------

function bc_category_add_form_fields() {
	?>
	<div class="form-field form-required">
		<label for="bc_gender"><?php esc_html_e( 'Gender', 'baig-cloth-headless' ); ?></label>
		<select name="bc_gender" id="bc_gender">
			<option value="women"><?php esc_html_e( 'Women', 'baig-cloth-headless' ); ?></option>
			<option value="men"><?php esc_html_e( 'Men', 'baig-cloth-headless' ); ?></option>
		</select>
		<p><?php esc_html_e( 'Which side of the storefront this category appears on.', 'baig-cloth-headless' ); ?></p>
	</div>
	<div class="form-field">
		<label for="bc_sort_order"><?php esc_html_e( 'Sort order', 'baig-cloth-headless' ); ?></label>
		<input type="number" name="bc_sort_order" id="bc_sort_order" value="0" step="1" />
		<p><?php esc_html_e( 'Lower numbers appear first in the storefront category list.', 'baig-cloth-headless' ); ?></p>
	</div>
	<?php
}
add_action( 'bc_category_add_form_fields', 'bc_category_add_form_fields' );

function bc_category_edit_form_fields( $term ) {
	$gender     = get_term_meta( $term->term_id, 'bc_gender', true );
	$sort_order = get_term_meta( $term->term_id, 'bc_sort_order', true );
	?>
	<tr class="form-field form-required">
		<th scope="row"><label for="bc_gender"><?php esc_html_e( 'Gender', 'baig-cloth-headless' ); ?></label></th>
		<td>
			<select name="bc_gender" id="bc_gender">
				<option value="women" <?php selected( $gender, 'women' ); ?>><?php esc_html_e( 'Women', 'baig-cloth-headless' ); ?></option>
				<option value="men" <?php selected( $gender, 'men' ); ?>><?php esc_html_e( 'Men', 'baig-cloth-headless' ); ?></option>
			</select>
		</td>
	</tr>
	<tr class="form-field">
		<th scope="row"><label for="bc_sort_order"><?php esc_html_e( 'Sort order', 'baig-cloth-headless' ); ?></label></th>
		<td><input type="number" name="bc_sort_order" id="bc_sort_order" value="<?php echo esc_attr( '' === $sort_order ? '0' : $sort_order ); ?>" step="1" /></td>
	</tr>
	<?php
}
add_action( 'bc_category_edit_form_fields', 'bc_category_edit_form_fields' );

function bc_save_category_term_meta( $term_id ) {
	if ( ! current_user_can( 'manage_categories' ) ) {
		return;
	}
	if ( isset( $_POST['bc_gender'] ) ) {
		$gender = sanitize_key( $_POST['bc_gender'] );
		if ( in_array( $gender, array( 'men', 'women' ), true ) ) {
			update_term_meta( $term_id, 'bc_gender', $gender );
		}
	}
	if ( isset( $_POST['bc_sort_order'] ) ) {
		update_term_meta( $term_id, 'bc_sort_order', (int) $_POST['bc_sort_order'] );
	}
}
add_action( 'created_bc_category', 'bc_save_category_term_meta' );
add_action( 'edited_bc_category', 'bc_save_category_term_meta' );

// Columns on the category list table.
function bc_category_columns( $columns ) {
	$columns['bc_gender']     = __( 'Gender', 'baig-cloth-headless' );
	$columns['bc_sort_order'] = __( 'Sort order', 'baig-cloth-headless' );
	return $columns;
}
add_filter( 'manage_edit-bc_category_columns', 'bc_category_columns' );

function bc_category_column_content( $content, $column, $term_id ) {
	if ( 'bc_gender' === $column ) {
		return esc_html( get_term_meta( $term_id, 'bc_gender', true ) );
	}
	if ( 'bc_sort_order' === $column ) {
		$v = get_term_meta( $term_id, 'bc_sort_order', true );
		return esc_html( '' === $v ? '0' : $v );
	}
	return $content;
}
add_filter( 'manage_bc_category_custom_column', 'bc_category_column_content', 10, 3 );

// ---------------------------------------------------------------------------
// Product list columns: thumbnail, category, price, stock, featured
// ---------------------------------------------------------------------------

function bc_product_columns( $columns ) {
	$new = array(
		'cb'           => $columns['cb'],
		'bc_thumb'     => __( 'Image', 'baig-cloth-headless' ),
		'title'        => $columns['title'],
		'bc_category'  => __( 'Category', 'baig-cloth-headless' ),
		'bc_price'     => __( 'Price', 'baig-cloth-headless' ),
		'bc_in_stock'  => __( 'In stock', 'baig-cloth-headless' ),
		'bc_featured'  => __( 'Featured', 'baig-cloth-headless' ),
		'date'         => $columns['date'],
	);
	return $new;
}
add_filter( 'manage_bc_product_posts_columns', 'bc_product_columns' );

function bc_product_column_content( $column, $post_id ) {
	switch ( $column ) {
		case 'bc_thumb':
			$urls = bc_get_product_image_urls( $post_id );
			if ( $urls ) {
				printf(
					'<img src="%s" alt="" style="width:48px;height:60px;object-fit:cover;border-radius:4px" />',
					esc_url( bc_display_image_url( $urls[0] ) )
				);
			} else {
				echo '&mdash;';
			}
			break;
		case 'bc_category':
			$terms = get_the_terms( $post_id, 'bc_category' );
			if ( $terms && ! is_wp_error( $terms ) ) {
				$term   = $terms[0];
				$gender = get_term_meta( $term->term_id, 'bc_gender', true );
				echo esc_html( $term->name . ( $gender ? " ({$gender})" : '' ) );
			} else {
				echo '<span style="color:#b32d2e">' . esc_html__( 'No category!', 'baig-cloth-headless' ) . '</span>';
			}
			break;
		case 'bc_price':
			$price      = get_post_meta( $post_id, '_bc_price', true );
			$on_sale    = '1' === get_post_meta( $post_id, '_bc_on_sale', true );
			$sale_price = get_post_meta( $post_id, '_bc_sale_price', true );
			if ( '' === $price ) {
				echo '&mdash;';
				break;
			}
			if ( $on_sale && '' !== $sale_price ) {
				printf(
					'<del>Rs %s</del> <strong>Rs %s</strong>',
					esc_html( $price ),
					esc_html( $sale_price )
				);
			} else {
				printf( 'Rs %s', esc_html( $price ) );
			}
			break;
		case 'bc_in_stock':
			echo '1' === get_post_meta( $post_id, '_bc_in_stock', true ) ? '✓' : '✗';
			break;
		case 'bc_featured':
			echo '1' === get_post_meta( $post_id, '_bc_featured', true ) ? '★' : '&mdash;';
			break;
	}
}
add_action( 'manage_bc_product_posts_custom_column', 'bc_product_column_content', 10, 2 );

/**
 * Image URLs stored by the catalog may be relative paths (/products/...)
 * served by the storefront host — for admin thumbnails those need the
 * storefront origin prepended or they 404 inside wp-admin.
 */
function bc_display_image_url( $url ) {
	if ( 0 === strpos( $url, '/' ) && 0 !== strpos( $url, '//' ) ) {
		$origin = rtrim( get_option( 'bc_storefront_origin', '' ), '/' );
		if ( $origin ) {
			return $origin . $url;
		}
	}
	return $url;
}
