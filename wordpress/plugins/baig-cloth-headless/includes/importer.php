<?php
/**
 * Catalog importer — brings the FastAPI/Postgres export (catalog-export.json,
 * produced by wordpress/migration/export_from_postgres.py) into WordPress.
 *
 * Idempotent: every imported category/product records its original database
 * id (bc_legacy_id / _bc_legacy_id), and anything whose legacy id already
 * exists is skipped on re-import, so running it twice never duplicates.
 *
 * Two entry points: Products → Import catalog (file upload, for shared
 * hosting), and `wp baig import <file>` where WP-CLI is available.
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
		<p><?php esc_html_e( 'Upload the catalog-export.json produced by the migration script. Safe to run more than once — already-imported items are skipped.', 'baig-cloth-headless' ); ?></p>

		<?php if ( $error ) : ?>
			<div class="notice notice-error"><p><?php echo esc_html( $error ); ?></p></div>
		<?php endif; ?>

		<?php if ( $report ) : ?>
			<div class="notice notice-success">
				<p>
					<?php
					printf(
						/* translators: counts */
						esc_html__( 'Done. Categories: %1$d created, %2$d skipped. Products: %3$d created, %4$d skipped.', 'baig-cloth-headless' ),
						(int) $report['categories_created'],
						(int) $report['categories_skipped'],
						(int) $report['products_created'],
						(int) $report['products_skipped']
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

function bc_run_catalog_import( $data ) {
	$report = array(
		'categories_created' => 0,
		'categories_skipped' => 0,
		'products_created'   => 0,
		'products_skipped'   => 0,
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

		if ( bc_find_product_by_legacy_id( $legacy_id ) ) {
			$report['products_skipped']++;
			continue;
		}

		$term_id = isset( $term_by_legacy[ (int) $prod['category_id'] ] )
			? $term_by_legacy[ (int) $prod['category_id'] ]
			: bc_find_term_by_legacy_id( (int) $prod['category_id'] );
		if ( ! $term_id ) {
			$report['warnings'][] = sprintf( 'Product "%s": its category (legacy id %d) was not found — skipped.', $prod['name'], (int) $prod['category_id'] );
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

		$post_id = wp_insert_post( $postarr, true );
		if ( is_wp_error( $post_id ) ) {
			$report['warnings'][] = sprintf( 'Product "%s": %s', $prod['name'], $post_id->get_error_message() );
			continue;
		}

		update_post_meta( $post_id, '_bc_legacy_id', (string) $legacy_id );
		update_post_meta( $post_id, '_bc_price', bc_format_price( $prod['price'] ) );
		if ( isset( $prod['sale_price'] ) && null !== $prod['sale_price'] && '' !== $prod['sale_price'] ) {
			update_post_meta( $post_id, '_bc_sale_price', bc_format_price( $prod['sale_price'] ) );
		}
		update_post_meta( $post_id, '_bc_on_sale', ! empty( $prod['on_sale'] ) ? '1' : '0' );
		if ( ! empty( $prod['sale_ends_at'] ) ) {
			try {
				$dt = new DateTimeImmutable( $prod['sale_ends_at'] );
				update_post_meta( $post_id, '_bc_sale_ends_at', $dt->setTimezone( new DateTimeZone( 'UTC' ) )->format( 'Y-m-d H:i:s' ) );
			} catch ( Exception $e ) {
				$report['warnings'][] = sprintf( 'Product "%s": unparseable sale_ends_at, left empty.', $prod['name'] );
			}
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
		update_post_meta( $post_id, '_bc_image_urls', wp_json_encode( $urls ) );

		wp_set_object_terms( $post_id, array( $term_id ), 'bc_category', false );
		$report['products_created']++;
	}

	return $report;
}

// ---------------------------------------------------------------------------
// WP-CLI: wp baig import <file>
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
					'Categories: %d created, %d skipped. Products: %d created, %d skipped.',
					$report['categories_created'],
					$report['categories_skipped'],
					$report['products_created'],
					$report['products_skipped']
				)
			);
		}
	);
}
