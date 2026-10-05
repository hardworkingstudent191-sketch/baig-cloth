<?php
/**
 * The product details + gallery metaboxes: price, sale pricing with the same
 * validation rules the storefront contract promises (sale price required and
 * strictly below price while on sale), stock/featured flags, and an image
 * list manager backed by the media library.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function bc_add_product_metaboxes() {
	add_meta_box( 'bc_product_details', __( 'Product details', 'baig-cloth-headless' ), 'bc_render_details_metabox', 'bc_product', 'normal', 'high' );
	add_meta_box( 'bc_product_gallery', __( 'Product images', 'baig-cloth-headless' ), 'bc_render_gallery_metabox', 'bc_product', 'normal', 'high' );
}
add_action( 'add_meta_boxes_bc_product', 'bc_add_product_metaboxes' );

function bc_admin_assets( $hook ) {
	if ( 'post.php' !== $hook && 'post-new.php' !== $hook ) {
		return;
	}
	$screen = get_current_screen();
	if ( ! $screen || 'bc_product' !== $screen->post_type ) {
		return;
	}
	wp_enqueue_media();
	wp_enqueue_script( 'bc-metabox', BC_HEADLESS_URL . 'admin/metabox.js', array( 'jquery' ), BC_HEADLESS_VERSION, true );
	wp_enqueue_style( 'bc-metabox', BC_HEADLESS_URL . 'admin/metabox.css', array(), BC_HEADLESS_VERSION );
	wp_localize_script(
		'bc-metabox',
		'bcMetabox',
		array(
			'chooseImages' => __( 'Choose images', 'baig-cloth-headless' ),
			'addToGallery' => __( 'Add to gallery', 'baig-cloth-headless' ),
			'storefront'   => rtrim( get_option( 'bc_storefront_origin', '' ), '/' ),
		)
	);
}
add_action( 'admin_enqueue_scripts', 'bc_admin_assets' );

function bc_render_details_metabox( $post ) {
	wp_nonce_field( 'bc_save_details', 'bc_details_nonce' );

	$price      = get_post_meta( $post->ID, '_bc_price', true );
	$sale_price = get_post_meta( $post->ID, '_bc_sale_price', true );
	$on_sale    = '1' === get_post_meta( $post->ID, '_bc_on_sale', true );
	$in_stock   = get_post_meta( $post->ID, '_bc_in_stock', true );
	$in_stock   = ( '' === $in_stock ) ? true : ( '1' === $in_stock ); // default new products to in stock
	$featured   = '1' === get_post_meta( $post->ID, '_bc_featured', true );

	// Stored UTC — edited in the site's timezone, same as every other date in wp-admin.
	$ends_utc   = get_post_meta( $post->ID, '_bc_sale_ends_at', true );
	$ends_local = '';
	if ( $ends_utc ) {
		$dt = date_create_immutable( $ends_utc, new DateTimeZone( 'UTC' ) );
		if ( $dt ) {
			$ends_local = $dt->setTimezone( wp_timezone() )->format( 'Y-m-d\TH:i' );
		}
	}
	?>
	<table class="form-table bc-details">
		<tr>
			<th scope="row"><label for="bc_price"><?php esc_html_e( 'Price (Rs)', 'baig-cloth-headless' ); ?> <span class="required">*</span></label></th>
			<td><input type="number" name="bc_price" id="bc_price" value="<?php echo esc_attr( $price ); ?>" step="0.01" min="0.01" required /></td>
		</tr>
		<tr>
			<th scope="row"><label for="bc_on_sale"><?php esc_html_e( 'On sale', 'baig-cloth-headless' ); ?></label></th>
			<td><label><input type="checkbox" name="bc_on_sale" id="bc_on_sale" value="1" <?php checked( $on_sale ); ?> /> <?php esc_html_e( 'This product is on sale', 'baig-cloth-headless' ); ?></label></td>
		</tr>
		<tr>
			<th scope="row"><label for="bc_sale_price"><?php esc_html_e( 'Sale price (Rs)', 'baig-cloth-headless' ); ?></label></th>
			<td>
				<input type="number" name="bc_sale_price" id="bc_sale_price" value="<?php echo esc_attr( $sale_price ); ?>" step="0.01" min="0.01" />
				<p class="description"><?php esc_html_e( 'Required while on sale, and must be below the regular price.', 'baig-cloth-headless' ); ?></p>
			</td>
		</tr>
		<tr>
			<th scope="row"><label for="bc_sale_ends_at"><?php esc_html_e( 'Sale ends', 'baig-cloth-headless' ); ?></label></th>
			<td>
				<input type="datetime-local" name="bc_sale_ends_at" id="bc_sale_ends_at" value="<?php echo esc_attr( $ends_local ); ?>" />
				<p class="description"><?php esc_html_e( 'Optional. After this time the storefront automatically stops showing the sale.', 'baig-cloth-headless' ); ?></p>
			</td>
		</tr>
		<tr>
			<th scope="row"><?php esc_html_e( 'Availability', 'baig-cloth-headless' ); ?></th>
			<td><label><input type="checkbox" name="bc_in_stock" value="1" <?php checked( $in_stock ); ?> /> <?php esc_html_e( 'In stock', 'baig-cloth-headless' ); ?></label></td>
		</tr>
		<tr>
			<th scope="row"><?php esc_html_e( 'Featured', 'baig-cloth-headless' ); ?></th>
			<td><label><input type="checkbox" name="bc_featured" value="1" <?php checked( $featured ); ?> /> <?php esc_html_e( 'Show in the homepage featured row', 'baig-cloth-headless' ); ?></label></td>
		</tr>
	</table>
	<?php
}

function bc_render_gallery_metabox( $post ) {
	$urls = bc_get_product_image_urls( $post->ID );
	?>
	<div id="bc-gallery" class="bc-gallery">
		<input type="hidden" name="bc_image_urls" id="bc_image_urls" value="<?php echo esc_attr( wp_json_encode( $urls ) ); ?>" />
		<ul id="bc-gallery-list" class="bc-gallery-list"></ul>
		<p>
			<button type="button" class="button" id="bc-add-media"><?php esc_html_e( 'Add from Media Library', 'baig-cloth-headless' ); ?></button>
		</p>
		<p class="bc-add-url">
			<input type="url" id="bc-url-input" placeholder="https://… or /products/…" class="regular-text" />
			<button type="button" class="button" id="bc-add-url"><?php esc_html_e( 'Add URL', 'baig-cloth-headless' ); ?></button>
		</p>
		<p class="description"><?php esc_html_e( 'The first image is the main one shown on product cards. Use the arrows to reorder.', 'baig-cloth-headless' ); ?></p>
	</div>
	<?php
}

/**
 * Accepts absolute http(s) URLs and root-relative paths (the 46 migrated
 * products reference /products/... files served by the storefront host).
 * Returns '' for anything else.
 */
function bc_sanitize_image_url( $url ) {
	$url = trim( (string) $url );
	if ( '' === $url ) {
		return '';
	}
	if ( 0 === strpos( $url, '/' ) && 0 !== strpos( $url, '//' ) ) {
		// Root-relative path: no scheme/host games possible, just clean it.
		return esc_url_raw( $url, array( 'http', 'https' ) ) ? esc_url_raw( $url ) : sanitize_text_field( $url );
	}
	$clean = esc_url_raw( $url, array( 'http', 'https' ) );
	return $clean ? $clean : '';
}

function bc_save_details_metabox( $post_id, $post ) {
	if ( 'bc_product' !== $post->post_type ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( wp_is_post_revision( $post_id ) ) {
		return;
	}
	if ( ! isset( $_POST['bc_details_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['bc_details_nonce'] ), 'bc_save_details' ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	$problems = array();

	// --- Price ---
	$price = isset( $_POST['bc_price'] ) ? (float) wp_unslash( $_POST['bc_price'] ) : 0;
	if ( $price > 0 ) {
		update_post_meta( $post_id, '_bc_price', number_format( $price, 2, '.', '' ) );
	} else {
		$problems[] = __( 'Price must be above zero — the previous price was kept.', 'baig-cloth-headless' );
		$price      = (float) get_post_meta( $post_id, '_bc_price', true );
	}

	// --- Sale price ---
	$sale_price_raw = isset( $_POST['bc_sale_price'] ) ? trim( (string) wp_unslash( $_POST['bc_sale_price'] ) ) : '';
	$sale_price     = ( '' !== $sale_price_raw ) ? (float) $sale_price_raw : null;
	if ( null !== $sale_price && $sale_price > 0 ) {
		update_post_meta( $post_id, '_bc_sale_price', number_format( $sale_price, 2, '.', '' ) );
	} elseif ( '' === $sale_price_raw ) {
		delete_post_meta( $post_id, '_bc_sale_price' );
		$sale_price = null;
	}

	// --- On sale, validated against the final merged state (same rule as the
	// --- original API: sale price required and strictly below price). ---
	$on_sale = isset( $_POST['bc_on_sale'] );
	if ( $on_sale ) {
		if ( null === $sale_price || $sale_price <= 0 ) {
			$problems[] = __( '"On sale" was switched off: a sale needs a sale price.', 'baig-cloth-headless' );
			$on_sale    = false;
		} elseif ( $price > 0 && $sale_price >= $price ) {
			$problems[] = __( '"On sale" was switched off: the sale price must be below the regular price.', 'baig-cloth-headless' );
			$on_sale    = false;
		}
	}
	update_post_meta( $post_id, '_bc_on_sale', $on_sale ? '1' : '0' );

	// --- Sale end date: entered in site timezone, stored UTC ---
	$ends_raw = isset( $_POST['bc_sale_ends_at'] ) ? sanitize_text_field( wp_unslash( $_POST['bc_sale_ends_at'] ) ) : '';
	if ( '' !== $ends_raw ) {
		$dt = date_create_immutable_from_format( 'Y-m-d\TH:i', $ends_raw, wp_timezone() );
		if ( $dt ) {
			update_post_meta( $post_id, '_bc_sale_ends_at', $dt->setTimezone( new DateTimeZone( 'UTC' ) )->format( 'Y-m-d H:i:s' ) );
		}
	} else {
		delete_post_meta( $post_id, '_bc_sale_ends_at' );
	}

	update_post_meta( $post_id, '_bc_in_stock', isset( $_POST['bc_in_stock'] ) ? '1' : '0' );
	update_post_meta( $post_id, '_bc_featured', isset( $_POST['bc_featured'] ) ? '1' : '0' );

	// --- Gallery ---
	if ( isset( $_POST['bc_image_urls'] ) ) {
		$decoded = json_decode( wp_unslash( $_POST['bc_image_urls'] ), true );
		$urls    = array();
		if ( is_array( $decoded ) ) {
			foreach ( $decoded as $u ) {
				$clean = bc_sanitize_image_url( $u );
				if ( '' !== $clean ) {
					$urls[] = $clean;
				}
			}
		}
		update_post_meta( $post_id, '_bc_image_urls', wp_json_encode( array_values( $urls ) ) );
	}

	if ( $problems ) {
		set_transient( 'bc_notice_' . get_current_user_id(), $problems, 60 );
	}
}
add_action( 'save_post', 'bc_save_details_metabox', 10, 2 );

function bc_admin_notices() {
	$problems = get_transient( 'bc_notice_' . get_current_user_id() );
	if ( ! $problems ) {
		return;
	}
	delete_transient( 'bc_notice_' . get_current_user_id() );
	foreach ( (array) $problems as $message ) {
		printf( '<div class="notice notice-warning is-dismissible"><p>%s</p></div>', esc_html( $message ) );
	}
}
add_action( 'admin_notices', 'bc_admin_notices' );
