<?php
/**
 * Settings page: CORS origins for the API and the storefront origin used to
 * preview relative image paths inside wp-admin. Also surfaces the API base
 * URL the frontend's VITE_API_URL should point to.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function bc_settings_menu() {
	add_submenu_page(
		'edit.php?post_type=bc_product',
		__( 'Storefront settings', 'baig-cloth-headless' ),
		__( 'Storefront settings', 'baig-cloth-headless' ),
		'manage_options',
		'bc-settings',
		'bc_render_settings_page'
	);
}
add_action( 'admin_menu', 'bc_settings_menu' );

function bc_register_settings() {
	register_setting(
		'bc_settings',
		'bc_cors_origins',
		array(
			'type'              => 'string',
			'default'           => '*',
			'sanitize_callback' => 'bc_sanitize_origins',
		)
	);
	register_setting(
		'bc_settings',
		'bc_storefront_origin',
		array(
			'type'              => 'string',
			'default'           => '',
			'sanitize_callback' => 'bc_sanitize_single_origin',
		)
	);
}
add_action( 'admin_init', 'bc_register_settings' );

function bc_sanitize_single_origin( $value ) {
	$value = trim( (string) $value );
	if ( '' === $value ) {
		return '';
	}
	$clean = esc_url_raw( $value, array( 'http', 'https' ) );
	return $clean ? untrailingslashit( $clean ) : '';
}

function bc_sanitize_origins( $value ) {
	$parts = array_filter( array_map( 'trim', preg_split( '/[\s,]+/', (string) $value ) ) );
	$clean = array();
	foreach ( $parts as $part ) {
		if ( '*' === $part ) {
			$clean[] = '*';
			continue;
		}
		$url = bc_sanitize_single_origin( $part );
		if ( $url ) {
			$clean[] = $url;
		}
	}
	return $clean ? implode( "\n", array_unique( $clean ) ) : '*';
}

function bc_render_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Not allowed.', 'baig-cloth-headless' ) );
	}
	$api_base = rest_url( 'baig/v1' );
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Storefront settings', 'baig-cloth-headless' ); ?></h1>

		<p>
			<?php esc_html_e( 'The React storefront reads the catalog from this API base URL — set it as VITE_API_URL in the frontend build:', 'baig-cloth-headless' ); ?><br />
			<code><?php echo esc_html( untrailingslashit( $api_base ) ); ?></code>
		</p>

		<form method="post" action="options.php">
			<?php settings_fields( 'bc_settings' ); ?>
			<table class="form-table">
				<tr>
					<th scope="row"><label for="bc_storefront_origin"><?php esc_html_e( 'Storefront origin', 'baig-cloth-headless' ); ?></label></th>
					<td>
						<input type="url" name="bc_storefront_origin" id="bc_storefront_origin" class="regular-text" value="<?php echo esc_attr( get_option( 'bc_storefront_origin', '' ) ); ?>" placeholder="https://baigcloth.com" />
						<p class="description"><?php esc_html_e( 'Used only to preview relative image paths (/products/…) inside wp-admin.', 'baig-cloth-headless' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="bc_cors_origins"><?php esc_html_e( 'Allowed API origins (CORS)', 'baig-cloth-headless' ); ?></label></th>
					<td>
						<textarea name="bc_cors_origins" id="bc_cors_origins" class="regular-text" rows="3"><?php echo esc_textarea( get_option( 'bc_cors_origins', '*' ) ); ?></textarea>
						<p class="description"><?php esc_html_e( 'One origin per line, e.g. https://baigcloth.com. The catalog is public data, so * (any origin) is a reasonable default.', 'baig-cloth-headless' ); ?></p>
					</td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}
