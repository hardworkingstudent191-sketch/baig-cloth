<?php
/**
 * v2 endpoints (same /baig/v1 namespace — all additive, the v1 contract is
 * untouched):
 *
 *   GET /site                       store & brand settings
 *   GET /slides                     homepage slides (published, in order)
 *   GET /collections                all collections (sorted)
 *   GET /collections/{slug}         one collection with its products
 *   GET /testimonials?featured=     testimonials
 *   GET /instagram                  curated Instagram grid
 *   GET /facets?gender=&category_id=   fabrics / colours / price range / collections for filters
 *   GET /home                       everything the homepage needs in ONE request
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function bc_register_rest_v2_routes() {
	$public = array( 'methods' => WP_REST_Server::READABLE, 'permission_callback' => '__return_true' );
	register_rest_route( 'baig/v1', '/site', $public + array( 'callback' => function () { return rest_ensure_response( bc_serialize_site() ); } ) );
	register_rest_route( 'baig/v1', '/slides', $public + array( 'callback' => function () { return rest_ensure_response( bc_get_slides() ); } ) );
	register_rest_route( 'baig/v1', '/collections', $public + array( 'callback' => function () { return rest_ensure_response( bc_get_collections() ); } ) );
	register_rest_route( 'baig/v1', '/collections/(?P<slug>[a-z0-9-]+)', $public + array( 'callback' => 'bc_rest_get_collection' ) );
	register_rest_route( 'baig/v1', '/testimonials', $public + array( 'callback' => 'bc_rest_testimonials' ) );
	register_rest_route( 'baig/v1', '/instagram', $public + array( 'callback' => function () { return rest_ensure_response( bc_get_instagram() ); } ) );
	register_rest_route( 'baig/v1', '/facets', $public + array( 'callback' => 'bc_rest_facets' ) );
	register_rest_route( 'baig/v1', '/home', $public + array( 'callback' => 'bc_rest_home' ) );
}
add_action( 'rest_api_init', 'bc_register_rest_v2_routes' );

function bc_rest_get_collection( $request ) {
	$term = get_term_by( 'slug', sanitize_title( $request['slug'] ), 'bc_collection' );
	if ( ! $term ) {
		return bc_error( 404, 'Collection not found' );
	}
	return rest_ensure_response( bc_serialize_collection( $term, true ) );
}

function bc_rest_testimonials( $request ) {
	$featured = bc_parse_bool_param( $request, 'featured' );
	if ( 'error' === $featured ) {
		return bc_error( 422, 'featured must be a boolean' );
	}
	return rest_ensure_response( bc_get_testimonials( true === $featured ) );
}

/** All published, categorised products as serialized arrays (shared by facets/home). */
function bc_all_products_serialized() {
	static $cache = null;
	if ( null !== $cache ) {
		return $cache;
	}
	$map   = bc_get_categories_map();
	$query = new WP_Query(
		array(
			'post_type'      => 'bc_product',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'orderby'        => array( 'date' => 'DESC', 'ID' => 'DESC' ),
			'no_found_rows'  => true,
		)
	);
	$cache = array();
	foreach ( $query->posts as $post ) {
		$p = bc_serialize_product( $post, $map );
		if ( 0 === $p['category_id'] || ! isset( $map[ $p['category_id'] ] ) ) {
			continue;
		}
		$cache[] = $p;
	}
	return $cache;
}

function bc_effective_price( $p ) {
	return (float) ( $p['on_sale'] && null !== $p['sale_price'] ? $p['sale_price'] : $p['price'] );
}

function bc_rest_facets( $request ) {
	if ( ! bc_params_are_scalar( $request, array( 'gender', 'category_id' ) ) ) {
		return bc_error( 422, 'query parameters must be single values' );
	}
	$gender = $request->get_param( 'gender' );
	if ( null !== $gender && ! in_array( $gender, array( 'men', 'women' ), true ) ) {
		return bc_error( 422, 'gender must be "men" or "women"' );
	}
	$category_id = $request->get_param( 'category_id' );
	$category_id = null !== $category_id ? bc_parse_int( $category_id ) : null;

	$fabrics = array();
	$colors  = array();
	$colls   = array();
	$min     = null;
	$max     = null;
	$map     = bc_get_collections();
	$by_slug = array();
	foreach ( $map as $c ) {
		$by_slug[ $c['slug'] ] = $c['name'];
	}

	foreach ( bc_all_products_serialized() as $p ) {
		if ( null !== $gender && $p['_gender'] !== $gender ) {
			continue;
		}
		if ( null !== $category_id && $p['category_id'] !== $category_id ) {
			continue;
		}
		if ( '' !== $p['fabric'] ) {
			$fabrics[ $p['fabric'] ] = ( isset( $fabrics[ $p['fabric'] ] ) ? $fabrics[ $p['fabric'] ] : 0 ) + 1;
		}
		if ( '' !== $p['color'] ) {
			if ( ! isset( $colors[ $p['color'] ] ) ) {
				$colors[ $p['color'] ] = array( 'name' => $p['color'], 'hex' => $p['color_hex'], 'count' => 0 );
			}
			$colors[ $p['color'] ]['count']++;
		}
		foreach ( $p['collections'] as $slug ) {
			$colls[ $slug ] = ( isset( $colls[ $slug ] ) ? $colls[ $slug ] : 0 ) + 1;
		}
		$price = bc_effective_price( $p );
		$min   = null === $min ? $price : min( $min, $price );
		$max   = null === $max ? $price : max( $max, $price );
	}
	ksort( $fabrics );
	ksort( $colors );

	return rest_ensure_response(
		array(
			'fabrics'     => array_map( function ( $k, $v ) { return array( 'value' => $k, 'count' => $v ); }, array_keys( $fabrics ), $fabrics ),
			'colors'      => array_values( $colors ),
			'collections' => array_map( function ( $k, $v ) use ( $by_slug ) { return array( 'slug' => $k, 'name' => isset( $by_slug[ $k ] ) ? $by_slug[ $k ] : $k, 'count' => $v ); }, array_keys( $colls ), $colls ),
			'price'       => array( 'min' => null === $min ? 0 : $min, 'max' => null === $max ? 0 : $max ),
		)
	);
}

function bc_rest_home() {
	$all      = bc_all_products_serialized();
	$strip    = function ( $p ) { unset( $p['_gender'] ); return $p; };
	$featured = array_values( array_filter( $all, function ( $p ) { return $p['featured']; } ) );
	$new      = array_values( array_filter( $all, function ( $p ) { return $p['is_new']; } ) );
	if ( count( $new ) < 4 ) {
		$new = $all; // a quiet month still gets a "latest" row
	}
	$on_sale = array_values( array_filter( $all, function ( $p ) { return $p['on_sale']; } ) );

	return rest_ensure_response(
		array(
			'site'         => bc_serialize_site(),
			'slides'       => bc_get_slides(),
			'collections'  => bc_get_collections( true ),
			'featured'     => array_map( $strip, array_slice( $featured, 0, 8 ) ),
			'new_arrivals' => array_map( $strip, array_slice( $new, 0, 8 ) ),
			'sale'         => array( 'count' => count( $on_sale ), 'preview' => array_map( $strip, array_slice( $on_sale, 0, 4 ) ) ),
			'counts'       => array(
				'women' => count( array_filter( $all, function ( $p ) { return 'women' === $p['_gender']; } ) ),
				'men'   => count( array_filter( $all, function ( $p ) { return 'men' === $p['_gender']; } ) ),
			),
			'testimonials' => array_slice( bc_get_testimonials( true ), 0, 6 ),
			'instagram'    => array_slice( bc_get_instagram(), 0, 8 ),
		)
	);
}
