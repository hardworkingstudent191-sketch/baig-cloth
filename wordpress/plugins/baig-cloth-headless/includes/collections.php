<?php
/**
 * Collections: curated groups of products with a cover image, optional video
 * and tagline — "Lawn 2026", "Festive Edit", "Wash & Wear Essentials". A
 * product can belong to several. Drives the homepage collection slides and
 * the lookbook page.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function bc_register_collections() {
	register_taxonomy(
		'bc_collection',
		'bc_product',
		array(
			'labels'             => array(
				'name'          => __( 'Collections', 'baig-cloth-headless' ),
				'singular_name' => __( 'Collection', 'baig-cloth-headless' ),
				'add_new_item'  => __( 'Add New Collection', 'baig-cloth-headless' ),
				'edit_item'     => __( 'Edit Collection', 'baig-cloth-headless' ),
			),
			'hierarchical'       => true, // checkbox UI; a product may be in several.
			'public'             => false,
			'show_ui'            => true,
			'show_admin_column'  => true,
			'show_in_quick_edit' => false,
			'show_in_rest'       => false,
		)
	);
}
add_action( 'init', 'bc_register_collections' );

function bc_collection_fields() {
	return array(
		'bc_tagline'    => array( 'text', __( 'Tagline', 'baig-cloth-headless' ), __( 'One line under the collection name, e.g. "Breathable prints for the long summer".', 'baig-cloth-headless' ) ),
		'bc_cover_url'  => array( 'media', __( 'Cover image URL', 'baig-cloth-headless' ), __( 'Portrait works best (4:5). Choose from the Media Library or paste a URL.', 'baig-cloth-headless' ) ),
		'bc_video_url'  => array( 'media', __( 'Cover video URL (optional)', 'baig-cloth-headless' ), __( 'Short muted MP4 loop; the cover image is its poster.', 'baig-cloth-headless' ) ),
		'bc_gender'     => array( 'gender', __( 'Audience', 'baig-cloth-headless' ), '' ),
		'bc_sort_order' => array( 'number', __( 'Sort order', 'baig-cloth-headless' ), __( 'Lower first.', 'baig-cloth-headless' ) ),
		'bc_featured'   => array( 'checkbox', __( 'Featured on homepage', 'baig-cloth-headless' ), '' ),
	);
}

function bc_collection_field_input( $key, $type, $value ) {
	switch ( $type ) {
		case 'media':
			printf( '<input type="text" name="%1$s" id="%1$s" value="%2$s" class="regular-text bc-media-url" />', esc_attr( $key ), esc_attr( $value ) );
			break;
		case 'gender':
			echo '<select name="' . esc_attr( $key ) . '" id="' . esc_attr( $key ) . '">';
			foreach ( array( 'all' => __( 'Everyone', 'baig-cloth-headless' ), 'women' => __( 'Women', 'baig-cloth-headless' ), 'men' => __( 'Men', 'baig-cloth-headless' ) ) as $v => $label ) {
				printf( '<option value="%s" %s>%s</option>', esc_attr( $v ), selected( $value ?: 'all', $v, false ), esc_html( $label ) );
			}
			echo '</select>';
			break;
		case 'number':
			printf( '<input type="number" name="%1$s" id="%1$s" value="%2$s" step="1" />', esc_attr( $key ), esc_attr( '' === $value ? '0' : $value ) );
			break;
		case 'checkbox':
			printf( '<input type="checkbox" name="%1$s" id="%1$s" value="1" %2$s />', esc_attr( $key ), checked( $value, '1', false ) );
			break;
		default:
			printf( '<input type="text" name="%1$s" id="%1$s" value="%2$s" class="regular-text" />', esc_attr( $key ), esc_attr( $value ) );
	}
}

function bc_collection_add_form_fields() {
	foreach ( bc_collection_fields() as $key => list( $type, $label, $help ) ) {
		echo '<div class="form-field"><label for="' . esc_attr( $key ) . '">' . esc_html( $label ) . '</label>';
		bc_collection_field_input( $key, $type, '' );
		if ( $help ) {
			echo '<p>' . esc_html( $help ) . '</p>';
		}
		echo '</div>';
	}
}
add_action( 'bc_collection_add_form_fields', 'bc_collection_add_form_fields' );

function bc_collection_edit_form_fields( $term ) {
	foreach ( bc_collection_fields() as $key => list( $type, $label, $help ) ) {
		echo '<tr class="form-field"><th scope="row"><label for="' . esc_attr( $key ) . '">' . esc_html( $label ) . '</label></th><td>';
		bc_collection_field_input( $key, $type, get_term_meta( $term->term_id, $key, true ) );
		if ( $help ) {
			echo '<p class="description">' . esc_html( $help ) . '</p>';
		}
		echo '</td></tr>';
	}
}
add_action( 'bc_collection_edit_form_fields', 'bc_collection_edit_form_fields' );

function bc_save_collection_meta( $term_id ) {
	if ( ! current_user_can( 'manage_categories' ) ) {
		return;
	}
	foreach ( bc_collection_fields() as $key => list( $type ) ) {
		if ( 'checkbox' === $type ) {
			update_term_meta( $term_id, $key, ! empty( $_POST[ $key ] ) ? '1' : '0' );
			continue;
		}
		if ( ! isset( $_POST[ $key ] ) ) {
			continue;
		}
		$raw = wp_unslash( $_POST[ $key ] );
		switch ( $type ) {
			case 'media':
				$value = bc_sanitize_image_url( $raw );
				break;
			case 'gender':
				$value = in_array( $raw, array( 'all', 'women', 'men' ), true ) ? $raw : 'all';
				break;
			case 'number':
				$value = (int) $raw;
				break;
			default:
				$value = sanitize_text_field( $raw );
		}
		update_term_meta( $term_id, $key, $value );
	}
}
add_action( 'created_bc_collection', 'bc_save_collection_meta' );
add_action( 'edited_bc_collection', 'bc_save_collection_meta' );

/** Serialize one collection term for the API. */
function bc_serialize_collection( $term, $with_products = false ) {
	$gender = get_term_meta( $term->term_id, 'bc_gender', true );
	$data   = array(
		'id'          => (int) $term->term_id,
		'slug'        => $term->slug,
		'name'        => wp_specialchars_decode( $term->name, ENT_QUOTES ),
		'tagline'     => (string) get_term_meta( $term->term_id, 'bc_tagline', true ),
		'description' => (string) $term->description,
		'cover'       => (string) get_term_meta( $term->term_id, 'bc_cover_url', true ),
		'video'       => (string) get_term_meta( $term->term_id, 'bc_video_url', true ),
		'gender'      => in_array( $gender, array( 'women', 'men' ), true ) ? $gender : 'all',
		'sort_order'  => (int) get_term_meta( $term->term_id, 'bc_sort_order', true ),
		'featured'    => '1' === get_term_meta( $term->term_id, 'bc_featured', true ),
		'count'       => (int) $term->count,
	);
	if ( $with_products ) {
		$query = new WP_Query(
			array(
				'post_type'      => 'bc_product',
				'post_status'    => 'publish',
				'posts_per_page' => 200,
				'orderby'        => array( 'date' => 'DESC', 'ID' => 'DESC' ),
				'no_found_rows'  => true,
				'tax_query'      => array( // phpcs:ignore WordPress.DB.SlowDBQuery
					array( 'taxonomy' => 'bc_collection', 'field' => 'term_id', 'terms' => array( (int) $term->term_id ) ),
				),
			)
		);
		$map      = bc_get_categories_map();
		$products = array();
		foreach ( $query->posts as $post ) {
			$p = bc_serialize_product( $post, $map );
			unset( $p['_gender'] );
			$products[] = $p;
		}
		$data['products'] = $products;
	}
	return $data;
}

function bc_get_collections( $featured_only = false ) {
	$terms = get_terms( array( 'taxonomy' => 'bc_collection', 'hide_empty' => false ) );
	if ( is_wp_error( $terms ) ) {
		return array();
	}
	$list = array_map( 'bc_serialize_collection', $terms );
	if ( $featured_only ) {
		$list = array_values( array_filter( $list, function ( $c ) { return $c['featured']; } ) );
	}
	usort( $list, function ( $a, $b ) { return $a['sort_order'] === $b['sort_order'] ? $a['id'] <=> $b['id'] : $a['sort_order'] <=> $b['sort_order']; } );
	return $list;
}
