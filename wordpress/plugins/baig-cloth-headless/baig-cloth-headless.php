<?php
/**
 * Plugin Name:       Baig Cloth Headless
 * Description:       Headless catalog backend for the Baig Cloth React storefront — products, categories, and a REST API that matches the storefront's contract exactly. Manage the catalog in wp-admin; the storefront reads /wp-json/baig/v1.
 * Version:           1.0.0
 * Requires at least: 6.4
 * Requires PHP:      7.4
 * Author:            Baig Cloth
 * License:           GPL-2.0-or-later
 * Text Domain:       baig-cloth-headless
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'BC_HEADLESS_VERSION', '1.0.0' );
define( 'BC_HEADLESS_DIR', plugin_dir_path( __FILE__ ) );
define( 'BC_HEADLESS_URL', plugin_dir_url( __FILE__ ) );

require_once BC_HEADLESS_DIR . 'includes/post-types.php';
require_once BC_HEADLESS_DIR . 'includes/metabox.php';
require_once BC_HEADLESS_DIR . 'includes/rest-api.php';
require_once BC_HEADLESS_DIR . 'includes/importer.php';
require_once BC_HEADLESS_DIR . 'includes/settings.php';

/**
 * Rewrite rules only need flushing when the CPT first appears or the plugin
 * updates — never on every request.
 */
function bc_headless_activate() {
	bc_register_post_types();
	flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'bc_headless_activate' );

function bc_headless_deactivate() {
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'bc_headless_deactivate' );
