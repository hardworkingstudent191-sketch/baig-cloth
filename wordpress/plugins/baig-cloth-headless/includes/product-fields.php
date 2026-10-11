<?php
/**
 * Product fields the v2 storefront needs beyond name/price/images:
 * fabric, piece count and per-piece meters, a colour swatch, the "design
 * group" that links colour variants of one design, care instructions,
 * free-form detail rows, SKU and an optional "new until" date.
 *
 * All additive: the v1 API fields and the parity contract are untouched;
 * bc_serialize_product() merges bc_product_extra_fields() into its output.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Fabric names offered as suggestions in the admin (free text is allowed). */
function bc_known_fabrics() {
	return array( 'Lawn', 'Cotton', 'Cambric', 'Khaddar', 'Karandi', 'Linen', 'Wash & Wear', 'Embroidered', 'Chiffon', 'Net', 'Silk', 'Viscose' );
}

function bc_add_fabric_metabox() {
	add_meta_box( 'bc_product_fabric', __( 'Fabric, colour & details', 'baig-cloth-headless' ), 'bc_render_fabric_metabox', 'bc_product', 'normal', 'high' );
}
add_action( 'add_meta_boxes_bc_product', 'bc_add_fabric_metabox' );

/** JSON meta -> array (always an array, never null). */
function bc_meta_json( $post_id, $key ) {
	$raw = get_post_meta( $post_id, $key, true );
	if ( '' === $raw || null === $raw ) {
		return array();
	}
	$decoded = json_decode( $raw, true );
	return is_array( $decoded ) ? $decoded : array();
}

function bc_render_fabric_metabox( $post ) {
	wp_nonce_field( 'bc_save_fabric', 'bc_fabric_nonce' );
	$id            = $post->ID;
	$sku           = get_post_meta( $id, '_bc_sku', true );
	$fabric        = get_post_meta( $id, '_bc_fabric', true );
	$pieces        = get_post_meta( $id, '_bc_pieces', true );
	$piece_details = bc_meta_json( $id, '_bc_piece_details' );
	$color         = get_post_meta( $id, '_bc_color', true );
	$color_hex     = get_post_meta( $id, '_bc_color_hex', true );
	$design_group  = get_post_meta( $id, '_bc_design_group', true );
	$care          = get_post_meta( $id, '_bc_care', true );
	$details       = bc_meta_json( $id, '_bc_details' );
	$new_until     = get_post_meta( $id, '_bc_new_until', true );
	?>
	<table class="form-table bc-details">
		<tr>
			<th scope="row"><label for="bc_sku"><?php esc_html_e( 'SKU / code', 'baig-cloth-headless' ); ?></label></th>
			<td><input type="text" name="bc_sku" id="bc_sku" value="<?php echo esc_attr( $sku ); ?>" class="regular-text" /></td>
		</tr>
		<tr>
			<th scope="row"><label for="bc_fabric"><?php esc_html_e( 'Fabric', 'baig-cloth-headless' ); ?></label></th>
			<td>
				<input type="text" name="bc_fabric" id="bc_fabric" list="bc_fabric_list" value="<?php echo esc_attr( $fabric ); ?>" class="regular-text" placeholder="Lawn, Wash & Wear, Karandi…" />
				<datalist id="bc_fabric_list">
					<?php foreach ( bc_known_fabrics() as $f ) : ?>
						<option value="<?php echo esc_attr( $f ); ?>"></option>
					<?php endforeach; ?>
				</datalist>
			</td>
		</tr>
		<tr>
			<th scope="row"><label for="bc_pieces"><?php esc_html_e( 'Pieces', 'baig-cloth-headless' ); ?></label></th>
			<td>
				<select name="bc_pieces" id="bc_pieces">
					<?php foreach ( array( '' => '—', '1' => '1-piece', '2' => '2-piece', '3' => '3-piece' ) as $v => $label ) : ?>
						<option value="<?php echo esc_attr( $v ); ?>" <?php selected( (string) $pieces, (string) $v ); ?>><?php echo esc_html( $label ); ?></option>
					<?php endforeach; ?>
				</select>
			</td>
		</tr>
		<tr>
			<th scope="row"><?php esc_html_e( 'What is included', 'baig-cloth-headless' ); ?></th>
			<td>
				<div class="bc-rows" data-rows="bc_piece_details" data-fields="name:Piece (e.g. Shirt),meters:Meters (e.g. 2.5)">
					<input type="hidden" name="bc_piece_details" value="<?php echo esc_attr( wp_json_encode( $piece_details ) ); ?>" />
					<div class="bc-rows-list"></div>
					<button type="button" class="button button-small bc-rows-add"><?php esc_html_e( '+ Add piece', 'baig-cloth-headless' ); ?></button>
				</div>
				<p class="description"><?php esc_html_e( 'Shown on the product page as "Shirt 3 m · Trouser 2.5 m · Dupatta 2.5 m".', 'baig-cloth-headless' ); ?></p>
			</td>
		</tr>
		<tr>
			<th scope="row"><label for="bc_color"><?php esc_html_e( 'Colour', 'baig-cloth-headless' ); ?></label></th>
			<td>
				<input type="text" name="bc_color" id="bc_color" value="<?php echo esc_attr( $color ); ?>" placeholder="Ash Grey" />
				<input type="color" name="bc_color_hex" id="bc_color_hex" value="<?php echo esc_attr( preg_match( '/^#[0-9a-fA-F]{6}$/', $color_hex ) ? $color_hex : '#888888' ); ?>" />
				<label><input type="checkbox" name="bc_color_hex_clear" value="1" /> <?php esc_html_e( 'no swatch', 'baig-cloth-headless' ); ?></label>
				<p class="description"><?php esc_html_e( 'The swatch colour is shown on cards and as a variant dot on the product page.', 'baig-cloth-headless' ); ?></p>
			</td>
		</tr>
		<tr>
			<th scope="row"><label for="bc_design_group"><?php esc_html_e( 'Design group', 'baig-cloth-headless' ); ?></label></th>
			<td>
				<input type="text" name="bc_design_group" id="bc_design_group" value="<?php echo esc_attr( $design_group ); ?>" class="regular-text" placeholder="wash-wear-2-piece" />
				<p class="description"><?php esc_html_e( 'Products with the same design group are colour variants of each other and show as swatches on each other\'s page. Leave empty for a one-off design.', 'baig-cloth-headless' ); ?></p>
			</td>
		</tr>
		<tr>
			<th scope="row"><?php esc_html_e( 'Details', 'baig-cloth-headless' ); ?></th>
			<td>
				<div class="bc-rows" data-rows="bc_details" data-fields="label:Label (e.g. Work),value:Value (e.g. Sequin embroidery)">
					<input type="hidden" name="bc_details" value="<?php echo esc_attr( wp_json_encode( $details ) ); ?>" />
					<div class="bc-rows-list"></div>
					<button type="button" class="button button-small bc-rows-add"><?php esc_html_e( '+ Add detail', 'baig-cloth-headless' ); ?></button>
				</div>
			</td>
		</tr>
		<tr>
			<th scope="row"><label for="bc_care"><?php esc_html_e( 'Care instructions', 'baig-cloth-headless' ); ?></label></th>
			<td><textarea name="bc_care" id="bc_care" rows="3" class="large-text"><?php echo esc_textarea( $care ); ?></textarea></td>
		</tr>
		<tr>
			<th scope="row"><label for="bc_new_until"><?php esc_html_e( 'Show "New" badge until', 'baig-cloth-headless' ); ?></label></th>
			<td>
				<input type="date" name="bc_new_until" id="bc_new_until" value="<?php echo esc_attr( $new_until ); ?>" />
				<p class="description"><?php esc_html_e( 'Optional. Products also count as new for 30 days after they are added.', 'baig-cloth-headless' ); ?></p>
			</td>
		</tr>
	</table>
	<?php
}

/** Sanitize a JSON list of flat string rows to the allowed keys. */
function bc_sanitize_rows( $raw, $keys ) {
	$decoded = json_decode( (string) wp_unslash( $raw ), true );
	$rows    = array();
	if ( ! is_array( $decoded ) ) {
		return $rows;
	}
	foreach ( $decoded as $row ) {
		if ( ! is_array( $row ) ) {
			continue;
		}
		$clean = array();
		$empty = true;
		foreach ( $keys as $k ) {
			$clean[ $k ] = isset( $row[ $k ] ) ? sanitize_text_field( (string) $row[ $k ] ) : '';
			if ( '' !== $clean[ $k ] ) {
				$empty = false;
			}
		}
		if ( ! $empty ) {
			$rows[] = $clean;
		}
	}
	return $rows;
}

function bc_save_fabric_metabox( $post_id, $post ) {
	if ( 'bc_product' !== $post->post_type || ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) ) {
		return;
	}
	if ( ! isset( $_POST['bc_fabric_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['bc_fabric_nonce'] ), 'bc_save_fabric' ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	$text = array( 'bc_sku' => '_bc_sku', 'bc_fabric' => '_bc_fabric', 'bc_color' => '_bc_color', 'bc_design_group' => '_bc_design_group' );
	foreach ( $text as $field => $key ) {
		$value = isset( $_POST[ $field ] ) ? sanitize_text_field( wp_unslash( $_POST[ $field ] ) ) : '';
		if ( '_bc_design_group' === $key ) {
			$value = sanitize_title( $value );
		}
		update_post_meta( $post_id, $key, $value );
	}

	$pieces = isset( $_POST['bc_pieces'] ) ? absint( $_POST['bc_pieces'] ) : 0;
	update_post_meta( $post_id, '_bc_pieces', $pieces > 0 && $pieces <= 3 ? (string) $pieces : '' );

	update_post_meta( $post_id, '_bc_piece_details', wp_slash( wp_json_encode( bc_sanitize_rows( isset( $_POST['bc_piece_details'] ) ? $_POST['bc_piece_details'] : '[]', array( 'name', 'meters' ) ) ) ) );
	update_post_meta( $post_id, '_bc_details', wp_slash( wp_json_encode( bc_sanitize_rows( isset( $_POST['bc_details'] ) ? $_POST['bc_details'] : '[]', array( 'label', 'value' ) ) ) ) );

	$hex = isset( $_POST['bc_color_hex'] ) ? strtolower( sanitize_text_field( wp_unslash( $_POST['bc_color_hex'] ) ) ) : '';
	if ( ! empty( $_POST['bc_color_hex_clear'] ) || ! preg_match( '/^#[0-9a-f]{6}$/', $hex ) ) {
		$hex = '';
	}
	update_post_meta( $post_id, '_bc_color_hex', $hex );

	update_post_meta( $post_id, '_bc_care', isset( $_POST['bc_care'] ) ? sanitize_textarea_field( wp_unslash( $_POST['bc_care'] ) ) : '' );

	$new_until = isset( $_POST['bc_new_until'] ) ? sanitize_text_field( wp_unslash( $_POST['bc_new_until'] ) ) : '';
	update_post_meta( $post_id, '_bc_new_until', preg_match( '/^\d{4}-\d{2}-\d{2}$/', $new_until ) ? $new_until : '' );
}
add_action( 'save_post', 'bc_save_fabric_metabox', 10, 2 );

// ---------------------------------------------------------------------------
// Serialization helpers used by the REST layer
// ---------------------------------------------------------------------------

/**
 * Responsive image data for a product image URL. Media Library uploads get
 * WordPress's generated sizes as a srcset; anything else (repo-relative
 * /products/... paths, external URLs) is passed through as-is.
 */
function bc_product_image( $url ) {
	static $cache = array();
	if ( isset( $cache[ $url ] ) ) {
		return $cache[ $url ];
	}
	$image = array( 'url' => $url );
	if ( 0 === strpos( $url, 'http' ) ) {
		$uploads = wp_get_upload_dir();
		if ( ! empty( $uploads['baseurl'] ) && 0 === strpos( $url, $uploads['baseurl'] ) ) {
			$attachment_id = attachment_url_to_postid( $url );
			if ( $attachment_id ) {
				$meta = wp_get_attachment_metadata( $attachment_id );
				if ( ! empty( $meta['width'] ) ) {
					$image['width']  = (int) $meta['width'];
					$image['height'] = (int) $meta['height'];
				}
				$srcset = wp_get_attachment_image_srcset( $attachment_id, 'full' );
				if ( $srcset ) {
					$image['srcset'] = $srcset;
				}
				$alt = get_post_meta( $attachment_id, '_wp_attachment_image_alt', true );
				if ( $alt ) {
					$image['alt'] = $alt;
				}
			}
		}
	}
	$cache[ $url ] = $image;
	return $image;
}

/** Colour variants: other published products sharing this design group. */
function bc_product_variants( $post_id, $design_group ) {
	static $groups = array();
	if ( '' === $design_group ) {
		return array();
	}
	if ( ! isset( $groups[ $design_group ] ) ) {
		$ids = get_posts(
			array(
				'post_type'      => 'bc_product',
				'post_status'    => 'publish',
				'posts_per_page' => 100,
				'fields'         => 'ids',
				'orderby'        => 'title',
				'order'          => 'ASC',
				'no_found_rows'  => true,
				'meta_key'       => '_bc_design_group', // phpcs:ignore WordPress.DB.SlowDBQuery
				'meta_value'     => $design_group, // phpcs:ignore WordPress.DB.SlowDBQuery
			)
		);
		$list = array();
		foreach ( $ids as $vid ) {
			$urls   = bc_get_product_image_urls( $vid );
			$stock  = get_post_meta( $vid, '_bc_in_stock', true );
			$list[] = array(
				'id'        => (int) $vid,
				'name'      => wp_specialchars_decode( get_the_title( $vid ), ENT_QUOTES ),
				'color'     => (string) get_post_meta( $vid, '_bc_color', true ),
				'color_hex' => (string) get_post_meta( $vid, '_bc_color_hex', true ),
				'image'     => $urls ? $urls[0] : null,
				'in_stock'  => ( '' === $stock ) ? true : ( '1' === $stock ),
			);
		}
		$groups[ $design_group ] = $list;
	}
	return array_values(
		array_filter(
			$groups[ $design_group ],
			function ( $v ) use ( $post_id ) {
				return $v['id'] !== (int) $post_id;
			}
		)
	);
}

/** The additive v2 fields for one product. */
function bc_product_extra_fields( $post, $image_urls ) {
	$id           = $post->ID;
	$design_group = (string) get_post_meta( $id, '_bc_design_group', true );
	$pieces       = get_post_meta( $id, '_bc_pieces', true );
	$new_until    = get_post_meta( $id, '_bc_new_until', true );
	$created      = strtotime( $post->post_date_gmt . ' UTC' );
	$is_new       = ( $created && $created >= time() - 30 * DAY_IN_SECONDS ) || ( $new_until && $new_until >= gmdate( 'Y-m-d' ) );

	$collections = array();
	$terms       = get_the_terms( $id, 'bc_collection' );
	if ( $terms && ! is_wp_error( $terms ) ) {
		foreach ( $terms as $t ) {
			$collections[] = $t->slug;
		}
	}

	return array(
		'sku'           => (string) get_post_meta( $id, '_bc_sku', true ),
		'fabric'        => (string) get_post_meta( $id, '_bc_fabric', true ),
		'pieces'        => '' === $pieces ? null : (int) $pieces,
		'piece_details' => bc_meta_json( $id, '_bc_piece_details' ),
		'color'         => (string) get_post_meta( $id, '_bc_color', true ),
		'color_hex'     => (string) get_post_meta( $id, '_bc_color_hex', true ),
		'design_group'  => $design_group,
		'variants'      => bc_product_variants( $id, $design_group ),
		'care'          => (string) get_post_meta( $id, '_bc_care', true ),
		'details'       => bc_meta_json( $id, '_bc_details' ),
		'is_new'        => (bool) $is_new,
		'collections'   => $collections,
		'images'        => array_map( 'bc_product_image', $image_urls ),
	);
}

// Colour swatch in the product list.
function bc_product_columns_v2( $columns ) {
	$out = array();
	foreach ( $columns as $key => $label ) {
		$out[ $key ] = $label;
		if ( 'bc_category' === $key ) {
			$out['bc_fabric'] = __( 'Fabric / colour', 'baig-cloth-headless' );
		}
	}
	return $out;
}
add_filter( 'manage_bc_product_posts_columns', 'bc_product_columns_v2', 20 );

function bc_product_column_v2( $column, $post_id ) {
	if ( 'bc_fabric' !== $column ) {
		return;
	}
	$fabric = get_post_meta( $post_id, '_bc_fabric', true );
	$color  = get_post_meta( $post_id, '_bc_color', true );
	$hex    = get_post_meta( $post_id, '_bc_color_hex', true );
	if ( $hex ) {
		printf( '<span style="display:inline-block;width:14px;height:14px;border-radius:50%%;background:%s;border:1px solid #ccd0d4;vertical-align:-2px;margin-right:6px"></span>', esc_attr( $hex ) );
	}
	echo esc_html( trim( $fabric . ( $color ? " · {$color}" : '' ) ) );
}
add_action( 'manage_bc_product_posts_custom_column', 'bc_product_column_v2', 10, 2 );
