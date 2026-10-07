<?php
/**
 * Public REST API under /wp-json/baig/v1 — a drop-in replacement for the
 * FastAPI backend's public contract. The React storefront points its
 * VITE_API_URL here and needs no code changes.
 *
 *   GET /products            filters: gender, category_id, on_sale, featured,
 *                            search, limit (default 100, max 200), offset
 *   GET /products/{id}
 *   GET /categories          filter: gender
 *
 * Shape parity rules (deliberate, do not "fix"):
 *  - prices serialize as strings with two decimals ("3000.00"), matching the
 *    original API's Decimal-to-JSON behaviour the frontend was built against;
 *  - a sale whose sale_ends_at has passed reports on_sale=false at read time
 *    without rewriting what the admin saved;
 *  - listings order newest-first (post date), the order "Newest" sorting
 *    relies on;
 *  - products without a category are excluded from listings (the original
 *    API inner-joined categories), but still resolve by id.
 *
 * The whole catalog is mapped in PHP and filtered in memory per request —
 * deliberate at this catalog's scale (tens of products, ~200 cap per page):
 * one code path for every filter beats a nest of meta_query edge cases.
 * Revisit if the catalog ever grows past a few thousand products.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function bc_register_rest_routes() {
	register_rest_route(
		'baig/v1',
		'/products',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'bc_rest_list_products',
			'permission_callback' => '__return_true',
		)
	);
	register_rest_route(
		'baig/v1',
		// Any segment, validated in the callback: a non-integer id is a 422 (as
		// the original API answered), not WordPress's generic "no route" 404.
		'/products/(?P<id>[^/]+)',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'bc_rest_get_product',
			'permission_callback' => '__return_true',
		)
	);
	register_rest_route(
		'baig/v1',
		'/categories',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'bc_rest_list_categories',
			'permission_callback' => '__return_true',
		)
	);
}
add_action( 'rest_api_init', 'bc_register_rest_routes' );

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

function bc_get_product_image_urls( $post_id ) {
	$raw = get_post_meta( $post_id, '_bc_image_urls', true );
	if ( '' === $raw || null === $raw ) {
		return array();
	}
	$decoded = json_decode( $raw, true );
	if ( ! is_array( $decoded ) ) {
		return array();
	}
	return array_values( array_filter( array_map( 'strval', $decoded ), 'strlen' ) );
}

/** All categories keyed by term_id: ['id','name','gender','sort_order']. */
function bc_get_categories_map() {
	$terms = get_terms(
		array(
			'taxonomy'   => 'bc_category',
			'hide_empty' => false,
		)
	);
	if ( is_wp_error( $terms ) ) {
		return array();
	}
	$map = array();
	foreach ( $terms as $term ) {
		$gender = get_term_meta( $term->term_id, 'bc_gender', true );
		$sort   = get_term_meta( $term->term_id, 'bc_sort_order', true );
		$map[ $term->term_id ] = array(
			'id'         => (int) $term->term_id,
			// WordPress stores term names kses-encoded ("Wash &amp; Wear");
			// the API serves plain text, JSON-escaped by the transport.
			'name'       => wp_specialchars_decode( $term->name, ENT_QUOTES ),
			'gender'     => in_array( $gender, array( 'men', 'women' ), true ) ? $gender : 'women',
			'sort_order' => ( '' === $sort ) ? 0 : (int) $sort,
		);
	}
	return $map;
}

function bc_format_price( $value ) {
	return number_format( (float) $value, 2, '.', '' );
}

/** Current UTC time as 'Y-m-d H:i:s', comparable to the stored sale end. */
function bc_utc_now_string() {
	return gmdate( 'Y-m-d H:i:s' );
}

/**
 * Serialize one product post to the contract shape. Mirrors the original
 * API's apply_sale_expiry: an expired sale reads as on_sale=false without
 * the stored flag being touched.
 */
function bc_serialize_product( $post, $categories_map ) {
	$id         = $post->ID;
	$price      = get_post_meta( $id, '_bc_price', true );
	$sale_price = get_post_meta( $id, '_bc_sale_price', true );
	$on_sale    = '1' === get_post_meta( $id, '_bc_on_sale', true );
	$ends_utc   = get_post_meta( $id, '_bc_sale_ends_at', true );
	$in_stock   = get_post_meta( $id, '_bc_in_stock', true );

	if ( $on_sale && '' !== $ends_utc && $ends_utc <= bc_utc_now_string() ) {
		$on_sale = false;
	}

	$term_ids    = wp_get_object_terms( $id, 'bc_category', array( 'fields' => 'ids' ) );
	$category_id = ( ! is_wp_error( $term_ids ) && $term_ids ) ? (int) $term_ids[0] : 0;

	$ends_out = null;
	if ( '' !== $ends_utc && null !== $ends_utc && false !== $ends_utc ) {
		$ends_out = str_replace( ' ', 'T', $ends_utc ) . '+00:00';
	}

	return array(
		'id'           => (int) $id,
		'name'         => wp_specialchars_decode( $post->post_title, ENT_QUOTES ),
		'category_id'  => $category_id,
		'description'  => (string) $post->post_content,
		'price'        => bc_format_price( $price ),
		'sale_price'   => ( '' !== $sale_price && null !== $sale_price ) ? bc_format_price( $sale_price ) : null,
		'on_sale'      => $on_sale,
		'sale_ends_at' => $ends_out,
		'in_stock'     => ( '' === $in_stock ) ? true : ( '1' === $in_stock ),
		'image_urls'   => bc_get_product_image_urls( $id ),
		'featured'     => '1' === get_post_meta( $id, '_bc_featured', true ),
		'created_at'   => str_replace( ' ', 'T', $post->post_date_gmt ) . '+00:00',
		'_gender'      => isset( $categories_map[ $category_id ] ) ? $categories_map[ $category_id ]['gender'] : null,
	);
}

function bc_error( $status, $detail ) {
	return new WP_REST_Response( array( 'detail' => $detail ), $status );
}

/** Tri-state boolean query param: null (absent), true, false — or an error string. */
function bc_parse_bool_param( $request, $name ) {
	$raw = $request->get_param( $name );
	if ( null === $raw ) {
		return null;
	}
	$parsed = filter_var( $raw, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE );
	if ( null === $parsed ) {
		return 'error';
	}
	return $parsed;
}

// ---------------------------------------------------------------------------
// Route callbacks
// ---------------------------------------------------------------------------

/** Strict integer parse: "12", "-3", "+4" -> int; "abc", "1.5", "", "1e3" -> null. */
function bc_parse_int( $value ) {
	if ( is_int( $value ) ) {
		return $value;
	}
	if ( is_string( $value ) && preg_match( '/^[+-]?\d+$/', trim( $value ) ) ) {
		return (int) $value;
	}
	return null;
}

/**
 * True when every named query param is absent or a plain scalar. PHP parses
 * `?search[]=x` into an array, and handing that to string functions is a
 * TypeError on PHP 8 — an anonymous request must never be able to fatal the
 * endpoint. The original API answered malformed params with a 422.
 */
function bc_params_are_scalar( $request, $names ) {
	foreach ( $names as $name ) {
		$value = $request->get_param( $name );
		if ( null !== $value && ! is_scalar( $value ) ) {
			return false;
		}
	}
	return true;
}

function bc_rest_list_products( $request ) {
	if ( ! bc_params_are_scalar( $request, array( 'gender', 'category_id', 'on_sale', 'featured', 'search', 'limit', 'offset' ) ) ) {
		return bc_error( 422, 'query parameters must be single values' );
	}

	$gender = $request->get_param( 'gender' );
	if ( null !== $gender && ! in_array( $gender, array( 'men', 'women' ), true ) ) {
		return bc_error( 422, 'gender must be "men" or "women"' );
	}

	$on_sale  = bc_parse_bool_param( $request, 'on_sale' );
	$featured = bc_parse_bool_param( $request, 'featured' );
	if ( 'error' === $on_sale || 'error' === $featured ) {
		return bc_error( 422, 'on_sale and featured must be booleans' );
	}

	// Integers are validated strictly, as the original API did (422 on a
	// non-integer, limit outside 1..200, negative offset) rather than being
	// silently clamped — a typo should be loud, not quietly return something.
	$category_id = $request->get_param( 'category_id' );
	if ( null !== $category_id ) {
		$category_id = bc_parse_int( $category_id );
		if ( null === $category_id ) {
			return bc_error( 422, 'category_id must be an integer' );
		}
	}

	$search = $request->get_param( 'search' );

	$limit = $request->get_param( 'limit' );
	if ( null === $limit ) {
		$limit = 100;
	} else {
		$limit = bc_parse_int( $limit );
		if ( null === $limit || $limit < 1 || $limit > 200 ) {
			return bc_error( 422, 'limit must be an integer between 1 and 200' );
		}
	}

	$offset = $request->get_param( 'offset' );
	if ( null === $offset ) {
		$offset = 0;
	} else {
		$offset = bc_parse_int( $offset );
		if ( null === $offset || $offset < 0 ) {
			return bc_error( 422, 'offset must be a non-negative integer' );
		}
	}

	$categories_map = bc_get_categories_map();

	$query = new WP_Query(
		array(
			'post_type'      => 'bc_product',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'orderby'        => array(
				'date' => 'DESC',
				'ID'   => 'DESC',
			),
			'no_found_rows'  => true,
		)
	);

	$products = array();
	foreach ( $query->posts as $post ) {
		$p = bc_serialize_product( $post, $categories_map );

		// Original API inner-joined categories: uncategorized products
		// never appear in listings.
		if ( 0 === $p['category_id'] || ! isset( $categories_map[ $p['category_id'] ] ) ) {
			continue;
		}
		if ( null !== $gender && $p['_gender'] !== $gender ) {
			continue;
		}
		if ( null !== $category_id && $p['category_id'] !== $category_id ) {
			continue;
		}
		if ( null !== $search && '' !== $search ) {
			$search   = (string) $search;
			$haystack = function_exists( 'mb_stripos' ) ? mb_stripos( $p['name'], $search ) : stripos( $p['name'], $search );
			if ( false === $haystack ) {
				continue;
			}
		}
		if ( null !== $featured && $p['featured'] !== $featured ) {
			continue;
		}
		if ( null !== $on_sale && $p['on_sale'] !== $on_sale ) {
			continue;
		}

		unset( $p['_gender'] );
		$products[] = $p;
	}

	return rest_ensure_response( array_slice( $products, $offset, $limit ) );
}

function bc_rest_get_product( $request ) {
	$id = bc_parse_int( $request['id'] );
	if ( null === $id ) {
		return bc_error( 422, 'product id must be an integer' );
	}
	$post = ( $id > 0 ) ? get_post( $id ) : null;
	if ( ! $post || 'bc_product' !== $post->post_type || 'publish' !== $post->post_status ) {
		return bc_error( 404, 'Product not found' );
	}
	$p = bc_serialize_product( $post, bc_get_categories_map() );
	unset( $p['_gender'] );
	return rest_ensure_response( $p );
}

function bc_rest_list_categories( $request ) {
	if ( ! bc_params_are_scalar( $request, array( 'gender' ) ) ) {
		return bc_error( 422, 'query parameters must be single values' );
	}

	$gender = $request->get_param( 'gender' );
	if ( null !== $gender && ! in_array( $gender, array( 'men', 'women' ), true ) ) {
		return bc_error( 422, 'gender must be "men" or "women"' );
	}

	$categories = array_values( bc_get_categories_map() );
	if ( null !== $gender ) {
		$categories = array_values(
			array_filter(
				$categories,
				function ( $c ) use ( $gender ) {
					return $c['gender'] === $gender;
				}
			)
		);
	}
	usort(
		$categories,
		function ( $a, $b ) {
			if ( $a['sort_order'] === $b['sort_order'] ) {
				return $a['id'] <=> $b['id'];
			}
			return $a['sort_order'] <=> $b['sort_order'];
		}
	);
	return rest_ensure_response( $categories );
}

// ---------------------------------------------------------------------------
// CORS for /baig/v1
//
// These endpoints serve the same public catalog the public website shows, so
// CORS here is about making the storefront work, not access control. The
// allowed origins live in an option (Settings page); '*' means any origin.
// Runs after core's rest_send_cors_headers (priority 10) and overrides its
// headers for our namespace only.
// ---------------------------------------------------------------------------

function bc_cors_headers( $served, $result, $request ) {
	$route = $request->get_route();
	if ( 0 !== strpos( $route, '/baig/v1' ) ) {
		return $served;
	}

	$allowed = get_option( 'bc_cors_origins', '*' );
	$allowed = array_filter( array_map( 'trim', preg_split( '/[\s,]+/', (string) $allowed ) ) );
	$origin  = get_http_origin();

	header_remove( 'Access-Control-Allow-Credentials' ); // public data, no cookies involved.

	if ( in_array( '*', $allowed, true ) ) {
		header( 'Access-Control-Allow-Origin: *' );
	} elseif ( $origin && in_array( $origin, $allowed, true ) ) {
		header( 'Access-Control-Allow-Origin: ' . esc_url_raw( $origin ) );
		header( 'Vary: Origin', false );
	} else {
		header_remove( 'Access-Control-Allow-Origin' );
	}
	header( 'Access-Control-Allow-Methods: GET, OPTIONS' );

	return $served;
}
add_filter( 'rest_pre_serve_request', 'bc_cors_headers', 15, 3 );
