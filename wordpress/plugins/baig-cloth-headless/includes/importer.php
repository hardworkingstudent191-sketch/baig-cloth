<?php
/**
 * Catalog importer — brings the FastAPI/Postgres export (catalog-export.json
 * or the enriched catalog-export.v2.json produced by
 * wordpress/migration/enrich_catalog.py) into WordPress.
 *
 * Idempotent: every imported category/product records its original database
 * id (bc_legacy_id / _bc_legacy_id). Re-running UPDATES products that already
 * exist (so an enriched export refreshes fabric/colour/variant data) and
 * never duplicates them; categories are matched the same way.
 *
 * Entry points: Products → Import catalog (file upload, for shared hosting),
 * `wp baig import <file>`, and `wp baig seed-demo` (placeholder slides,
 * collections, testimonials and Instagram posts for a fresh site).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function bc_importer_menu() {
	add_submenu_page(
		'edit.php?post_type=bc_product',
		__( 'Import catalog', 'baig-cloth-headless' ),
		__( 'Import catalog', 'baig-cloth-headless' ),
		'manage_options',
		'bc-import',
		'bc_render_import_page'
	);
}
add_action( 'admin_menu', 'bc_importer_menu' );

function bc_render_import_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Not allowed.', 'baig-cloth-headless' ) );
	}

	$report = null;
	$error  = null;

	if ( isset( $_POST['bc_import_nonce'] ) && wp_verify_nonce( sanitize_key( $_POST['bc_import_nonce'] ), 'bc_import' ) ) {
		if ( empty( $_FILES['bc_catalog_file']['tmp_name'] ) || ! is_uploaded_file( $_FILES['bc_catalog_file']['tmp_name'] ) ) {
			$error = __( 'No file received — choose the catalog-export.json file first.', 'baig-cloth-headless' );
		} else {
			$json = file_get_contents( $_FILES['bc_catalog_file']['tmp_name'] ); // phpcs:ignore WordPress.WP.AlternativeFunctions
			$data = json_decode( (string) $json, true );
			if ( ! is_array( $data ) || ! isset( $data['categories'], $data['products'] ) ) {
				$error = __( 'That file does not look like a catalog export (needs "categories" and "products").', 'baig-cloth-headless' );
			} else {
				$report = bc_run_catalog_import( $data );
			}
		}
	}
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Import catalog', 'baig-cloth-headless' ); ?></h1>
		<p><?php esc_html_e( 'Upload the catalog export produced by the migration scripts. Safe to run more than once — existing products are updated, never duplicated.', 'baig-cloth-headless' ); ?></p>

		<?php if ( $error ) : ?>
			<div class="notice notice-error"><p><?php echo esc_html( $error ); ?></p></div>
		<?php endif; ?>

		<?php if ( $report ) : ?>
			<div class="notice notice-success">
				<p>
					<?php
					printf(
						/* translators: counts */
						esc_html__( 'Done. Categories: %1$d created, %2$d existing. Products: %3$d created, %4$d updated.', 'baig-cloth-headless' ),
						(int) $report['categories_created'],
						(int) $report['categories_skipped'],
						(int) $report['products_created'],
						(int) $report['products_updated']
					);
					?>
				</p>
				<?php if ( ! empty( $report['warnings'] ) ) : ?>
					<ul>
						<?php foreach ( $report['warnings'] as $w ) : ?>
							<li><?php echo esc_html( $w ); ?></li>
						<?php endforeach; ?>
					</ul>
				<?php endif; ?>
			</div>
		<?php endif; ?>

		<form method="post" enctype="multipart/form-data">
			<?php wp_nonce_field( 'bc_import', 'bc_import_nonce' ); ?>
			<input type="file" name="bc_catalog_file" accept=".json,application/json" required />
			<?php submit_button( __( 'Import', 'baig-cloth-headless' ) ); ?>
		</form>
	</div>
	<?php
}

/** Find a term by its legacy (Postgres) id. Returns term_id or 0. */
function bc_find_term_by_legacy_id( $legacy_id ) {
	$terms = get_terms(
		array(
			'taxonomy'   => 'bc_category',
			'hide_empty' => false,
			'meta_key'   => 'bc_legacy_id', // phpcs:ignore WordPress.DB.SlowDBQuery
			'meta_value' => (string) $legacy_id, // phpcs:ignore WordPress.DB.SlowDBQuery
		)
	);
	return ( ! is_wp_error( $terms ) && $terms ) ? (int) $terms[0]->term_id : 0;
}

/** Find a product post by its legacy (Postgres) id. Returns post ID or 0. */
function bc_find_product_by_legacy_id( $legacy_id ) {
	$found = get_posts(
		array(
			'post_type'      => 'bc_product',
			'post_status'    => 'any',
			'posts_per_page' => 1,
			'fields'         => 'ids',
			'meta_key'       => '_bc_legacy_id', // phpcs:ignore WordPress.DB.SlowDBQuery
			'meta_value'     => (string) $legacy_id, // phpcs:ignore WordPress.DB.SlowDBQuery
		)
	);
	return $found ? (int) $found[0] : 0;
}

/** Get-or-create a collection term by slug (name defaults to a title-cased slug). */
function bc_collection_term_id( $slug, $name = '' ) {
	$slug = sanitize_title( $slug );
	if ( '' === $slug ) {
		return 0;
	}
	$term = get_term_by( 'slug', $slug, 'bc_collection' );
	if ( $term ) {
		return (int) $term->term_id;
	}
	$result = wp_insert_term( $name ?: ucwords( str_replace( '-', ' ', $slug ) ), 'bc_collection', array( 'slug' => $slug ) );
	return is_wp_error( $result ) ? 0 : (int) $result['term_id'];
}

/**
 * Write every product field from an import row onto a post (v1 fields plus
 * the optional v2 ones). Used for both create and update.
 */
function bc_apply_product_fields( $post_id, $prod, &$warnings ) {
	update_post_meta( $post_id, '_bc_price', bc_format_price( $prod['price'] ) );
	if ( isset( $prod['sale_price'] ) && null !== $prod['sale_price'] && '' !== $prod['sale_price'] ) {
		update_post_meta( $post_id, '_bc_sale_price', bc_format_price( $prod['sale_price'] ) );
	} else {
		delete_post_meta( $post_id, '_bc_sale_price' );
	}
	update_post_meta( $post_id, '_bc_on_sale', ! empty( $prod['on_sale'] ) ? '1' : '0' );
	if ( ! empty( $prod['sale_ends_at'] ) ) {
		try {
			$dt = new DateTimeImmutable( $prod['sale_ends_at'] );
			update_post_meta( $post_id, '_bc_sale_ends_at', $dt->setTimezone( new DateTimeZone( 'UTC' ) )->format( 'Y-m-d H:i:s' ) );
		} catch ( Exception $e ) {
			$warnings[] = sprintf( 'Product "%s": unparseable sale_ends_at, left empty.', $prod['name'] );
		}
	} else {
		delete_post_meta( $post_id, '_bc_sale_ends_at' );
	}
	update_post_meta( $post_id, '_bc_in_stock', ( ! isset( $prod['in_stock'] ) || $prod['in_stock'] ) ? '1' : '0' );
	update_post_meta( $post_id, '_bc_featured', ! empty( $prod['featured'] ) ? '1' : '0' );

	$urls = array();
	foreach ( (array) ( isset( $prod['image_urls'] ) ? $prod['image_urls'] : array() ) as $u ) {
		$clean = bc_sanitize_image_url( $u );
		if ( '' !== $clean ) {
			$urls[] = $clean;
		}
	}
	update_post_meta( $post_id, '_bc_image_urls', wp_slash( wp_json_encode( $urls ) ) ); // update_post_meta unslashes.

	// ---- v2 fields: only touched when present in the row ----
	foreach ( array( 'sku' => '_bc_sku', 'fabric' => '_bc_fabric', 'color' => '_bc_color', 'care' => '_bc_care', 'new_until' => '_bc_new_until' ) as $field => $key ) {
		if ( array_key_exists( $field, $prod ) ) {
			update_post_meta( $post_id, $key, 'care' === $field ? sanitize_textarea_field( (string) $prod[ $field ] ) : sanitize_text_field( (string) $prod[ $field ] ) );
		}
	}
	if ( array_key_exists( 'design_group', $prod ) ) {
		update_post_meta( $post_id, '_bc_design_group', sanitize_title( (string) $prod['design_group'] ) );
	}
	if ( array_key_exists( 'color_hex', $prod ) ) {
		$hex = strtolower( (string) $prod['color_hex'] );
		update_post_meta( $post_id, '_bc_color_hex', preg_match( '/^#[0-9a-f]{6}$/', $hex ) ? $hex : '' );
	}
	if ( array_key_exists( 'pieces', $prod ) ) {
		$n = (int) $prod['pieces'];
		update_post_meta( $post_id, '_bc_pieces', $n >= 1 && $n <= 3 ? (string) $n : '' );
	}
	if ( array_key_exists( 'piece_details', $prod ) ) {
		update_post_meta( $post_id, '_bc_piece_details', wp_slash( wp_json_encode( bc_sanitize_rows( wp_json_encode( $prod['piece_details'] ), array( 'name', 'meters' ) ) ) ) );
	}
	if ( array_key_exists( 'details', $prod ) ) {
		update_post_meta( $post_id, '_bc_details', wp_slash( wp_json_encode( bc_sanitize_rows( wp_json_encode( $prod['details'] ), array( 'label', 'value' ) ) ) ) );
	}
	if ( array_key_exists( 'collections', $prod ) && is_array( $prod['collections'] ) ) {
		$ids = array();
		foreach ( $prod['collections'] as $slug ) {
			$tid = bc_collection_term_id( (string) $slug );
			if ( $tid ) {
				$ids[] = $tid;
			}
		}
		wp_set_object_terms( $post_id, $ids, 'bc_collection', false );
	}
}

function bc_run_catalog_import( $data ) {
	// The import inserts each product as "publish" BEFORE writing its price
	// meta, which the publish gate would (rightly, for manual edits) downgrade
	// to draft. Rows are validated below instead, so step the gate aside.
	remove_filter( 'wp_insert_post_data', 'bc_gate_publish_without_price', 10 );
	try {
		return bc_do_catalog_import( $data );
	} finally {
		add_filter( 'wp_insert_post_data', 'bc_gate_publish_without_price', 10, 2 );
	}
}

function bc_do_catalog_import( $data ) {
	$report = array(
		'categories_created' => 0,
		'categories_skipped' => 0,
		'products_created'   => 0,
		'products_updated'   => 0,
		'warnings'           => array(),
	);

	// --- Categories first; remember legacy id -> term_id for the products. ---
	$term_by_legacy = array();

	foreach ( (array) $data['categories'] as $cat ) {
		if ( ! isset( $cat['id'], $cat['name'], $cat['gender'] ) ) {
			$report['warnings'][] = 'Skipped a category with missing fields.';
			continue;
		}
		$legacy_id = (int) $cat['id'];

		$existing = bc_find_term_by_legacy_id( $legacy_id );
		if ( $existing ) {
			$term_by_legacy[ $legacy_id ] = $existing;
			$report['categories_skipped']++;
			continue;
		}

		$gender = in_array( $cat['gender'], array( 'men', 'women' ), true ) ? $cat['gender'] : 'women';
		// Names repeat across genders ("Cotton" men + women) — slugs must not.
		$slug   = sanitize_title( $gender . '-' . $cat['name'] );
		$result = wp_insert_term( $cat['name'], 'bc_category', array( 'slug' => $slug ) );
		if ( is_wp_error( $result ) ) {
			$report['warnings'][] = sprintf( 'Category "%s": %s', $cat['name'], $result->get_error_message() );
			continue;
		}
		$term_id = (int) $result['term_id'];
		update_term_meta( $term_id, 'bc_gender', $gender );
		update_term_meta( $term_id, 'bc_sort_order', isset( $cat['sort_order'] ) ? (int) $cat['sort_order'] : 0 );
		update_term_meta( $term_id, 'bc_legacy_id', (string) $legacy_id );
		$term_by_legacy[ $legacy_id ] = $term_id;
		$report['categories_created']++;
	}

	// --- Products. ---
	foreach ( (array) $data['products'] as $prod ) {
		if ( ! isset( $prod['id'], $prod['name'], $prod['category_id'], $prod['price'] ) ) {
			$report['warnings'][] = 'Skipped a product with missing fields.';
			continue;
		}
		$legacy_id = (int) $prod['id'];

		// The publish gate is stepped aside for the import, so enforce the
		// contract's price > 0 here: a bad row must not go live as "0.00".
		if ( ! is_numeric( $prod['price'] ) || (float) $prod['price'] <= 0 ) {
			$report['warnings'][] = sprintf( 'Product "%s": price "%s" is not a number above zero — skipped.', $prod['name'], (string) $prod['price'] );
			continue;
		}

		$term_id = isset( $term_by_legacy[ (int) $prod['category_id'] ] )
			? $term_by_legacy[ (int) $prod['category_id'] ]
			: bc_find_term_by_legacy_id( (int) $prod['category_id'] );
		if ( ! $term_id ) {
			$report['warnings'][] = sprintf( 'Product "%s": its category (legacy id %d) was not found — skipped.', $prod['name'], (int) $prod['category_id'] );
			continue;
		}

		$existing_id = bc_find_product_by_legacy_id( $legacy_id );
		if ( $existing_id ) {
			wp_update_post(
				wp_slash(
					array(
						'ID'           => $existing_id,
						'post_title'   => wp_strip_all_tags( (string) $prod['name'] ),
						'post_content' => (string) ( isset( $prod['description'] ) ? $prod['description'] : '' ),
					)
				)
			);
			bc_apply_product_fields( $existing_id, $prod, $report['warnings'] );
			wp_set_object_terms( $existing_id, array( $term_id ), 'bc_category', false );
			$report['products_updated']++;
			continue;
		}

		// Preserve the original creation time so "newest first" order carries over.
		$gmt_date = '';
		if ( ! empty( $prod['created_at'] ) ) {
			try {
				$dt       = new DateTimeImmutable( $prod['created_at'] );
				$gmt_date = $dt->setTimezone( new DateTimeZone( 'UTC' ) )->format( 'Y-m-d H:i:s' );
			} catch ( Exception $e ) {
				$report['warnings'][] = sprintf( 'Product "%s": unparseable created_at, using now.', $prod['name'] );
			}
		}

		$postarr = array(
			'post_type'    => 'bc_product',
			'post_status'  => 'publish',
			'post_title'   => wp_strip_all_tags( (string) $prod['name'] ),
			'post_content' => (string) ( isset( $prod['description'] ) ? $prod['description'] : '' ),
		);
		if ( $gmt_date ) {
			$postarr['post_date_gmt'] = $gmt_date;
			$postarr['post_date']     = get_date_from_gmt( $gmt_date );
		}

		// wp_insert_post() expects slashed data and unslashes it; without
		// wp_slash() any backslash in a name or description is silently lost.
		$post_id = wp_insert_post( wp_slash( $postarr ), true );
		if ( is_wp_error( $post_id ) ) {
			$report['warnings'][] = sprintf( 'Product "%s": %s', $prod['name'], $post_id->get_error_message() );
			continue;
		}

		update_post_meta( $post_id, '_bc_legacy_id', (string) $legacy_id );
		bc_apply_product_fields( $post_id, $prod, $report['warnings'] );
		wp_set_object_terms( $post_id, array( $term_id ), 'bc_category', false );
		$report['products_created']++;
	}

	return $report;
}

// ---------------------------------------------------------------------------
// Demo content for a fresh site: placeholder slides, collections, testimonials
// and Instagram posts, all pointing at the storefront's /media placeholders.
// The owner replaces them in wp-admin; nothing here is final copy.
// ---------------------------------------------------------------------------

function bc_seed_demo_content( $force = false ) {
	$existing = get_posts( array( 'post_type' => 'bc_slide', 'post_status' => 'any', 'posts_per_page' => 1, 'fields' => 'ids' ) );
	if ( $existing && ! $force ) {
		return 'Demo content already present (slides exist) — pass --force to add anyway.';
	}

	$make = function ( $type, $title, $content, $meta, $order ) {
		$id = wp_insert_post( wp_slash( array( 'post_type' => $type, 'post_status' => 'publish', 'post_title' => $title, 'post_content' => $content, 'menu_order' => $order ) ), true );
		if ( is_wp_error( $id ) ) {
			return 0;
		}
		foreach ( $meta as $k => $v ) {
			update_post_meta( $id, $k, $v );
		}
		return $id;
	};

	$slides = array(
		array( 'Cloth worth cutting into something of your own', 'Hand-picked lawn, cotton and embroidered unstitched fabric — ordered over WhatsApp.', 'New in · Summer', 'video', '/media/hero-fabric-1920.webp', '/media/hero-fabric-mobile-1280.webp', '/media/hero-fabric-1080.mp4', 'Shop Women', '/women', 'light' ),
		array( 'Lawn that breathes', 'Prints for the long Faisalabad summer.', 'Lawn 2026', 'image', '/media/hero-lawn-1920.webp', '/media/hero-lawn-mobile-1280.webp', '', 'Explore Lawn', '/women/lawn', 'light' ),
		array( 'Wash & Wear in 27 colours', 'The everyday suit, crease-resistant and ready for the tailor.', 'Men', 'image', '/media/hero-men-1920.webp', '/media/hero-men-mobile-1280.webp', '', 'Shop Men', '/men/wash-wear', 'light' ),
	);
	foreach ( $slides as $i => $s ) {
		$make( 'bc_slide', $s[0], '', array( '_bc_subheadline' => $s[1], '_bc_eyebrow' => $s[2], '_bc_media_type' => $s[3], '_bc_image_url' => $s[4], '_bc_image_mobile_url' => $s[5], '_bc_video_url' => $s[6], '_bc_cta_label' => $s[7], '_bc_cta_url' => $s[8], '_bc_tone' => $s[9] ), $i );
	}

	$collections = array(
		array( 'lawn-2026', 'Lawn 2026', 'Breathable prints for the long summer.', '/media/collection-lawn-1280.webp', 'women', 0, array( 'Lawn' ), '/media/collection-lawn-1080.mp4' ),
		array( 'festive-edit', 'Festive Edit', 'Embroidered three-piece suits for weddings and Eid.', '/media/collection-festive-1280.webp', 'women', 1, array( 'Embroidered' ), '' ),
		array( 'wash-wear-essentials', 'Wash & Wear Essentials', 'One design, twenty-seven colours.', '/media/collection-wash-wear-1280.webp', 'men', 2, array( 'Wash & Wear' ), '' ),
	);
	$cat_map = bc_get_categories_map();
	foreach ( $collections as $c ) {
		$tid = bc_collection_term_id( $c[0], $c[1] );
		if ( ! $tid ) {
			continue;
		}
		update_term_meta( $tid, 'bc_tagline', $c[2] );
		update_term_meta( $tid, 'bc_cover_url', $c[3] );
		update_term_meta( $tid, 'bc_video_url', $c[7] );
		update_term_meta( $tid, 'bc_gender', $c[4] );
		update_term_meta( $tid, 'bc_sort_order', $c[5] );
		update_term_meta( $tid, 'bc_featured', '1' );
		// Assign every product whose category name matches.
		$cat_ids = array();
		foreach ( $cat_map as $id => $cat ) {
			if ( in_array( $cat['name'], $c[6], true ) && $cat['gender'] === $c[4] ) {
				$cat_ids[] = $id;
			}
		}
		if ( $cat_ids ) {
			$ids = get_posts( array( 'post_type' => 'bc_product', 'post_status' => 'publish', 'posts_per_page' => -1, 'fields' => 'ids', 'tax_query' => array( array( 'taxonomy' => 'bc_category', 'field' => 'term_id', 'terms' => $cat_ids ) ) ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
			foreach ( $ids as $pid ) {
				wp_set_object_terms( $pid, array( $tid ), 'bc_collection', true );
			}
		}
	}

	$testimonials = array(
		array( 'Ayesha', 'Faisalabad', 'Ordered two lawn suits over WhatsApp on a Tuesday, had them by Thursday. The print was exactly like the photo.', 5, 'WhatsApp', '/media/lookbook-1-768.webp', '1' ),
		array( 'Hamza', 'Lahore', 'The wash & wear fabric is genuinely crease-free. I bought navy and charcoal, then went back for olive.', 5, 'WhatsApp', '', '1' ),
		array( 'Sana', 'Karachi', 'Got the embroidered three-piece for my sister\'s walima. The embroidery is heavier than it looks online — in a good way.', 5, 'Instagram', '/media/lookbook-2-768.webp', '1' ),
		array( 'Usman', 'Faisalabad', 'Visited the shop, they cut and measured everything in front of me. Honest people.', 5, 'In store', '', '1' ),
		array( 'Mariam', 'Islamabad', 'Asked for colour advice on WhatsApp and they sent close-up videos of three options before I chose. Lovely service.', 5, 'WhatsApp', '/media/lookbook-3-768.webp', '0' ),
	);
	foreach ( $testimonials as $i => $t ) {
		$make( 'bc_testimonial', $t[0], $t[2], array( '_bc_city' => $t[1], '_bc_rating' => (string) $t[3], '_bc_source' => $t[4], '_bc_photo_url' => $t[5], '_bc_featured' => $t[6] ), $i );
	}

	for ( $i = 1; $i <= 8; $i++ ) {
		$make( 'bc_instagram', "Placeholder post {$i}", '', array( '_bc_image_url' => "/media/insta-{$i}-768.webp", '_bc_link_url' => 'https://www.instagram.com/' ), $i );
	}

	$site = bc_get_site_settings();
	$site['announcement_active'] = '1';
	update_option( 'bc_site', bc_sanitize_site_settings( $site ) );

	return 'Seeded 3 slides, 3 collections (products assigned), 5 testimonials, 8 Instagram posts; announcement bar on.';
}

// ---------------------------------------------------------------------------
// WP-CLI: wp baig import <file>  ·  wp baig seed-demo [--force]
// ---------------------------------------------------------------------------

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	WP_CLI::add_command(
		'baig import',
		function ( $args ) {
			list( $file ) = $args;
			if ( ! file_exists( $file ) ) {
				WP_CLI::error( "File not found: {$file}" );
			}
			$data = json_decode( (string) file_get_contents( $file ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions
			if ( ! is_array( $data ) || ! isset( $data['categories'], $data['products'] ) ) {
				WP_CLI::error( 'Not a catalog export (needs "categories" and "products").' );
			}
			$report = bc_run_catalog_import( $data );
			foreach ( $report['warnings'] as $w ) {
				WP_CLI::warning( $w );
			}
			WP_CLI::success(
				sprintf(
					'Categories: %d created, %d existing. Products: %d created, %d updated.',
					$report['categories_created'],
					$report['categories_skipped'],
					$report['products_created'],
					$report['products_updated']
				)
			);
		}
	);
	WP_CLI::add_command(
		'baig seed-demo',
		function ( $args, $assoc ) {
			WP_CLI::success( bc_seed_demo_content( ! empty( $assoc['force'] ) ) );
		}
	);
}
