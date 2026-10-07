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
			<td><input type="number" name="bc_price" id="bc_price" value="<?php echo esc_attr( $price ); ?>" step="0.01" min="0.01" /></td>
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
			<?php // type="text", not "url": a root-relative path (/products/a.jpg) is not a valid url value, and an invalid value in a form field blocks Update/Publish. ?>
			<input type="text" id="bc-url-input" placeholder="https://… or /products/…" class="regular-text" autocomplete="off" />
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
	// Control characters first: esc_url strips tabs/newlines, so "/\t/evil.com"
	// would otherwise pass the single-slash check below and come out as
	// "//evil.com".
	$url = trim( preg_replace( '/[\x00-\x1F\x7F]/', '', (string) $url ) );
	if ( '' === $url || false !== strpos( $url, '\\' ) ) {
		return '';
	}
	if ( 0 === strpos( $url, '/' ) && 0 !== strpos( $url, '//' ) ) {
		// Root-relative path: no scheme/host games possible, just clean it.
		$clean = esc_url_raw( $url, array( 'http', 'https' ) );
		$clean = $clean ? $clean : sanitize_text_field( $url );
	} else {
		// esc_url skips its protocol check for anything starting with "/", so
		// a protocol-relative "//host/x.jpg" must be rejected explicitly.
		$clean = esc_url_raw( $url, array( 'http', 'https' ) );
	}
	return ( $clean && 0 !== strpos( $clean, '//' ) ) ? $clean : '';
}

/**
 * Server-side price gate. The browser's required/min attributes are the only
 * other defence, and Quick Edit, autosaved drafts and REST writes bypass
 * them (those paths never post the metabox nonce, so the save handler below
 * does not even run). A product with no valid price must not go live — it
 * would serve "0.00" and quote "Rs 0.00" in the WhatsApp message.
 *
 * Runs on wp_insert_post_data (before the row is written), so the status can
 * still be downgraded to draft. The effective price is the one being posted
 * with the metabox, or — when the metabox did not post one — the price
 * already saved on the product (which the save handler keeps on bad input).
 */
function bc_gate_publish_without_price( $data, $postarr ) {
	// 'future' too: WordPress turns publish + a future date into 'future'
	// BEFORE this filter runs, and wp_publish_post() later takes it live with
	// no filter at all — so a scheduled product must pass the same gate.
	if ( 'bc_product' !== $data['post_type'] || ! in_array( $data['post_status'], array( 'publish', 'future' ), true ) ) {
		return $data;
	}

	$post_id  = isset( $postarr['ID'] ) ? (int) $postarr['ID'] : 0;
	$problems = array();

	// --- Price: the one being posted, else the one already saved. ---
	$posted = null;
	if ( isset( $_POST['bc_details_nonce'], $_POST['bc_price'] ) && wp_verify_nonce( sanitize_key( $_POST['bc_details_nonce'] ), 'bc_save_details' ) ) {
		$posted = (float) wp_unslash( $_POST['bc_price'] );
	}
	$price = ( null !== $posted && $posted > 0 )
		? $posted
		: ( $post_id ? (float) get_post_meta( $post_id, '_bc_price', true ) : 0.0 );
	if ( $price <= 0 ) {
		$problems[] = __( 'a price above zero', 'baig-cloth-headless' );
	}

	// --- Category: a product without one is excluded from every storefront
	// --- listing, so it must not go live uncategorised. ---
	$term_id = 0;
	if ( isset( $_POST['bc_category_nonce'], $_POST['bc_category_term'] ) && wp_verify_nonce( sanitize_key( $_POST['bc_category_nonce'] ), 'bc_save_category' ) ) {
		$term_id = absint( $_POST['bc_category_term'] );
	}
	if ( $term_id <= 0 && $post_id ) {
		$existing = wp_get_object_terms( $post_id, 'bc_category', array( 'fields' => 'ids' ) );
		$term_id  = ( ! is_wp_error( $existing ) && $existing ) ? (int) $existing[0] : 0;
	}
	if ( $term_id <= 0 ) {
		$problems[] = __( 'a category', 'baig-cloth-headless' );
	}

	if ( ! $problems ) {
		return $data;
	}

	$data['post_status'] = 'draft';
	bc_add_admin_notice(
		sprintf(
			/* translators: %s: what is missing, e.g. "a price above zero and a category" */
			__( 'Saved as a draft: a product needs %s before it can be published.', 'baig-cloth-headless' ),
			implode( ' ' . __( 'and', 'baig-cloth-headless' ) . ' ', $problems )
		)
	);
	return $data;
}

/** Queue a one-shot wp-admin warning, merging with any already queued this request. */
function bc_add_admin_notice( $message ) {
	$key      = 'bc_notice_' . get_current_user_id();
	$existing = get_transient( $key );
	$existing = is_array( $existing ) ? $existing : array();
	if ( ! in_array( $message, $existing, true ) ) {
		$existing[] = $message;
	}
	set_transient( $key, $existing, 60 );
}
add_filter( 'wp_insert_post_data', 'bc_gate_publish_without_price', 10, 2 );

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
		// update_post_meta() wp_unslash()es its value. wp_json_encode escapes
		// "/" and non-ASCII as backslash sequences, so without wp_slash() a URL
		// like /products/کرتا.jpg is stored as "u06a9..." and a backslash would
		// corrupt the JSON outright. ASCII paths survived, which hid it.
		update_post_meta( $post_id, '_bc_image_urls', wp_slash( wp_json_encode( array_values( $urls ) ) ) );
	}

	foreach ( $problems as $problem ) {
		bc_add_admin_notice( $problem );
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
