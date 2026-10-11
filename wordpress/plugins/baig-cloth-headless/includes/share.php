<?php
/**
 * Per-product link previews ("share cards").
 *
 * The storefront is a static single-page app, so every product URL serves the
 * same HTML and WhatsApp/Facebook — which never run JavaScript — would show
 * one site-wide preview for every shared piece. This endpoint fixes that
 * without server-side rendering the storefront:
 *
 *   GET {wordpress}/share/product/{id}
 *
 * returns a tiny HTML page whose Open Graph tags describe THAT product (name,
 * price, first photo), with og:url pointing at the storefront product page.
 * Humans who land on it are sent straight on to the storefront (meta refresh
 * + JS + a visible link). The storefront's .htaccess redirects known
 * link-preview crawlers from /product/{id} to here, so sharing the normal
 * product URL is enough — nobody has to share a special link.
 *
 * Needs the storefront origin (Products → Storefront settings) to turn the
 * catalog's relative image paths (/products/...) into absolute URLs and to
 * know where to send people.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function bc_register_share_rewrite() {
	add_rewrite_rule( '^share/product/([0-9]+)/?$', 'index.php?bc_share_product=$matches[1]', 'top' );
}
add_action( 'init', 'bc_register_share_rewrite' );

function bc_share_query_vars( $vars ) {
	$vars[] = 'bc_share_product';
	return $vars;
}
add_filter( 'query_vars', 'bc_share_query_vars' );

/** Absolute URL for a catalog image: relative /products/... paths need the storefront origin. */
function bc_absolute_image_url( $url, $storefront ) {
	if ( '' === $url ) {
		return '';
	}
	if ( 0 === strpos( $url, '/' ) ) {
		return $storefront ? $storefront . $url : '';
	}
	return $url;
}

/** Plain-text, single-line, length-capped description for a preview card. */
function bc_share_description( $product ) {
	$price = 'Rs ' . number_format( (float) ( $product['on_sale'] && $product['sale_price'] ? $product['sale_price'] : $product['price'] ) );
	$text  = trim( wp_strip_all_tags( $product['description'] ) );
	$text  = preg_replace( '/\s+/', ' ', $text );
	$lead  = $product['in_stock'] ? $price : $price . ' · Out of stock';
	if ( '' === $text ) {
		return $lead . ' · Order on WhatsApp';
	}
	$combined = $lead . ' · ' . $text;
	return mb_strlen( $combined ) > 180 ? mb_substr( $combined, 0, 177 ) . '…' : $combined;
}

function bc_share_template_redirect() {
	$id = get_query_var( 'bc_share_product' );
	if ( '' === $id || null === $id ) {
		return;
	}

	$id   = absint( $id );
	$post = $id ? get_post( $id ) : null;
	if ( ! $post || 'bc_product' !== $post->post_type || 'publish' !== $post->post_status ) {
		status_header( 404 );
		nocache_headers();
		header( 'Content-Type: text/html; charset=utf-8' );
		echo '<!doctype html><meta charset="utf-8"><title>Product not found</title><p>This product is no longer available.</p>';
		exit;
	}

	$product    = bc_serialize_product( $post, bc_get_categories_map() );
	$storefront = rtrim( get_option( 'bc_storefront_origin', '' ), '/' );
	$target     = $storefront ? $storefront . '/product/' . $id : home_url( '/' );
	$image      = ! empty( $product['image_urls'] ) ? bc_absolute_image_url( $product['image_urls'][0], $storefront ) : '';
	$title      = $product['name'] . ' — Baig Cloth';
	$desc       = bc_share_description( $product );

	// Crawlers cache these; a stale card is harmless, a stale price is not —
	// keep it short so a sale starting or ending shows up within the hour.
	status_header( 200 );
	header( 'Content-Type: text/html; charset=utf-8' );
	header( 'Cache-Control: public, max-age=600' );
	header( 'X-Robots-Tag: noindex' ); // search engines should index the storefront, never this page.
	?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?php echo esc_html( $title ); ?></title>
<meta name="robots" content="noindex">
<meta name="description" content="<?php echo esc_attr( $desc ); ?>">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Baig Cloth">
<meta property="og:title" content="<?php echo esc_attr( $title ); ?>">
<meta property="og:description" content="<?php echo esc_attr( $desc ); ?>">
<meta property="og:url" content="<?php echo esc_url( $target ); ?>">
<?php if ( $image ) : ?>
<meta property="og:image" content="<?php echo esc_url( $image ); ?>">
<meta property="og:image:alt" content="<?php echo esc_attr( $product['name'] ); ?>">
<?php endif; ?>
<meta property="product:price:amount" content="<?php echo esc_attr( $product['on_sale'] && $product['sale_price'] ? $product['sale_price'] : $product['price'] ); ?>">
<meta property="product:price:currency" content="PKR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<?php echo esc_attr( $title ); ?>">
<meta name="twitter:description" content="<?php echo esc_attr( $desc ); ?>">
<?php if ( $image ) : ?>
<meta name="twitter:image" content="<?php echo esc_url( $image ); ?>">
<?php endif; ?>
<link rel="canonical" href="<?php echo esc_url( $target ); ?>">
<meta http-equiv="refresh" content="0;url=<?php echo esc_attr( $target ); ?>">
<script>location.replace(<?php echo wp_json_encode( $target ); ?>);</script>
<style>body{font:16px/1.5 system-ui,sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;background:#f6f4ef;color:#1b1b1f}a{color:#223c80}</style>
</head>
<body>
<p>Taking you to <a href="<?php echo esc_url( $target ); ?>"><?php echo esc_html( $product['name'] ); ?></a>…</p>
</body>
</html>
	<?php
	exit;
}
add_action( 'template_redirect', 'bc_share_template_redirect' );
