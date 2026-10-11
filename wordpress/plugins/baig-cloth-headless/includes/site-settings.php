<?php
/**
 * Store & brand settings — the facts the storefront shows everywhere
 * (address, hours, WhatsApp number, socials, announcement bar, story) in one
 * wp-admin screen and one API call (GET /baig/v1/site).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function bc_site_defaults() {
	return array(
		'tagline'             => 'Unstitched fabric, chosen by hand.',
		'about_story'         => "Baig Cloth is a family fabric shop in Faisalabad — Pakistan's textile city. We hand-pick lawn, cotton, wash & wear and embroidered unstitched pieces for men and women, and keep ordering as simple as sending a WhatsApp message.",
		'address'             => "Baig Cloth\nMain Bazaar\nFaisalabad, Punjab",
		'city'                => 'Faisalabad',
		'phone_display'       => '+92 326 5382969',
		'whatsapp'            => '923265382969',
		'email'               => '',
		'hours'               => "Mon – Sat|11:00 am – 10:00 pm\nSun|2:00 pm – 10:00 pm",
		'map_url'             => 'https://maps.google.com/?q=Faisalabad',
		'map_lat'             => '31.4504',
		'map_lng'             => '73.1350',
		'instagram_url'       => '',
		'facebook_url'        => '',
		'tiktok_url'          => '',
		'youtube_url'         => '',
		'announcement_text'   => 'Free delivery in Faisalabad on orders over Rs 5,000',
		'announcement_url'    => '/policies',
		'announcement_active' => '0',
		'delivery_note'       => 'Delivery across Pakistan in 3–5 working days. Charges confirmed on WhatsApp before dispatch.',
		'established'         => '',
	);
}

function bc_get_site_settings() {
	$saved = get_option( 'bc_site', array() );
	return array_merge( bc_site_defaults(), is_array( $saved ) ? $saved : array() );
}

function bc_sanitize_site_settings( $input ) {
	$defaults = bc_site_defaults();
	$out      = array();
	$input    = is_array( $input ) ? $input : array();
	foreach ( $defaults as $key => $default ) {
		$raw = isset( $input[ $key ] ) ? $input[ $key ] : '';
		switch ( $key ) {
			case 'about_story':
			case 'address':
			case 'hours':
			case 'delivery_note':
				$out[ $key ] = sanitize_textarea_field( $raw );
				break;
			case 'whatsapp':
				$out[ $key ] = preg_replace( '/\D+/', '', (string) $raw );
				break;
			case 'email':
				$out[ $key ] = sanitize_email( $raw );
				break;
			case 'map_url':
			case 'instagram_url':
			case 'facebook_url':
			case 'tiktok_url':
			case 'youtube_url':
				$out[ $key ] = $raw ? esc_url_raw( $raw, array( 'http', 'https' ) ) : '';
				break;
			case 'announcement_active':
				$out[ $key ] = empty( $raw ) ? '0' : '1';
				break;
			case 'map_lat':
			case 'map_lng':
				$out[ $key ] = is_numeric( $raw ) ? (string) (float) $raw : '';
				break;
			default:
				$out[ $key ] = sanitize_text_field( $raw );
		}
	}
	return $out;
}

function bc_register_site_settings() {
	register_setting( 'bc_site_group', 'bc_site', array( 'type' => 'array', 'sanitize_callback' => 'bc_sanitize_site_settings' ) );
}
add_action( 'admin_init', 'bc_register_site_settings' );

function bc_site_settings_menu() {
	add_submenu_page( 'edit.php?post_type=bc_product', __( 'Store & brand', 'baig-cloth-headless' ), __( 'Store & brand', 'baig-cloth-headless' ), 'manage_options', 'bc-site', 'bc_render_site_settings_page' );
}
add_action( 'admin_menu', 'bc_site_settings_menu' );

function bc_render_site_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Not allowed.', 'baig-cloth-headless' ) );
	}
	$s      = bc_get_site_settings();
	$fields = array(
		array( 'Brand', null, null ),
		array( 'tagline', __( 'Tagline', 'baig-cloth-headless' ), 'text' ),
		array( 'about_story', __( 'Our story', 'baig-cloth-headless' ), 'textarea' ),
		array( 'established', __( 'Established (year)', 'baig-cloth-headless' ), 'text' ),
		array( 'Contact & store', null, null ),
		array( 'whatsapp', __( 'WhatsApp number (digits only, with country code)', 'baig-cloth-headless' ), 'text' ),
		array( 'phone_display', __( 'Phone as shown', 'baig-cloth-headless' ), 'text' ),
		array( 'email', __( 'Email', 'baig-cloth-headless' ), 'text' ),
		array( 'address', __( 'Address (one line per row)', 'baig-cloth-headless' ), 'textarea' ),
		array( 'city', __( 'City', 'baig-cloth-headless' ), 'text' ),
		array( 'hours', __( 'Opening hours — one per line as "Days|Hours"', 'baig-cloth-headless' ), 'textarea' ),
		array( 'map_url', __( 'Google Maps link', 'baig-cloth-headless' ), 'text' ),
		array( 'map_lat', __( 'Map latitude', 'baig-cloth-headless' ), 'text' ),
		array( 'map_lng', __( 'Map longitude', 'baig-cloth-headless' ), 'text' ),
		array( 'delivery_note', __( 'Delivery note', 'baig-cloth-headless' ), 'textarea' ),
		array( 'Social', null, null ),
		array( 'instagram_url', __( 'Instagram URL', 'baig-cloth-headless' ), 'text' ),
		array( 'facebook_url', __( 'Facebook URL', 'baig-cloth-headless' ), 'text' ),
		array( 'tiktok_url', __( 'TikTok URL', 'baig-cloth-headless' ), 'text' ),
		array( 'youtube_url', __( 'YouTube URL', 'baig-cloth-headless' ), 'text' ),
		array( 'Announcement bar', null, null ),
		array( 'announcement_active', __( 'Show announcement bar', 'baig-cloth-headless' ), 'checkbox' ),
		array( 'announcement_text', __( 'Announcement text', 'baig-cloth-headless' ), 'text' ),
		array( 'announcement_url', __( 'Announcement link (optional)', 'baig-cloth-headless' ), 'text' ),
	);
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Store & brand', 'baig-cloth-headless' ); ?></h1>
		<p><?php esc_html_e( 'Everything the storefront says about the shop — shown in the header, footer, store page and WhatsApp buttons.', 'baig-cloth-headless' ); ?></p>
		<form method="post" action="options.php">
			<?php settings_fields( 'bc_site_group' ); ?>
			<table class="form-table">
				<?php foreach ( $fields as list( $key, $label, $type ) ) : ?>
					<?php if ( null === $type ) : ?>
						<tr><th colspan="2"><h2 style="margin:1.5em 0 0"><?php echo esc_html( $key ); ?></h2></th></tr>
						<?php continue; ?>
					<?php endif; ?>
					<tr>
						<th scope="row"><label for="bc_site_<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $label ); ?></label></th>
						<td>
							<?php if ( 'textarea' === $type ) : ?>
								<textarea name="bc_site[<?php echo esc_attr( $key ); ?>]" id="bc_site_<?php echo esc_attr( $key ); ?>" rows="4" class="large-text"><?php echo esc_textarea( $s[ $key ] ); ?></textarea>
							<?php elseif ( 'checkbox' === $type ) : ?>
								<input type="checkbox" name="bc_site[<?php echo esc_attr( $key ); ?>]" id="bc_site_<?php echo esc_attr( $key ); ?>" value="1" <?php checked( $s[ $key ], '1' ); ?> />
							<?php else : ?>
								<input type="text" name="bc_site[<?php echo esc_attr( $key ); ?>]" id="bc_site_<?php echo esc_attr( $key ); ?>" value="<?php echo esc_attr( $s[ $key ] ); ?>" class="regular-text" />
							<?php endif; ?>
						</td>
					</tr>
				<?php endforeach; ?>
			</table>
			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}

/** Public shape of the settings (hours parsed into rows). */
function bc_serialize_site() {
	$s     = bc_get_site_settings();
	$hours = array();
	foreach ( preg_split( '/\r?\n/', (string) $s['hours'] ) as $line ) {
		$line = trim( $line );
		if ( '' === $line ) {
			continue;
		}
		$parts   = array_map( 'trim', explode( '|', $line, 2 ) );
		$hours[] = array( 'days' => $parts[0], 'hours' => isset( $parts[1] ) ? $parts[1] : '' );
	}
	return array(
		'name'          => 'Baig Cloth',
		'tagline'       => $s['tagline'],
		'about_story'   => $s['about_story'],
		'established'   => $s['established'],
		'whatsapp'      => $s['whatsapp'],
		'phone_display' => $s['phone_display'],
		'email'         => $s['email'],
		'address'       => array_values( array_filter( array_map( 'trim', preg_split( '/\r?\n/', (string) $s['address'] ) ) ) ),
		'city'          => $s['city'],
		'hours'         => $hours,
		'map'           => array(
			'url' => $s['map_url'],
			'lat' => '' === $s['map_lat'] ? null : (float) $s['map_lat'],
			'lng' => '' === $s['map_lng'] ? null : (float) $s['map_lng'],
		),
		'social'        => array_filter(
			array(
				'instagram' => $s['instagram_url'],
				'facebook'  => $s['facebook_url'],
				'tiktok'    => $s['tiktok_url'],
				'youtube'   => $s['youtube_url'],
			)
		),
		'announcement'  => '1' === $s['announcement_active'] && '' !== $s['announcement_text']
			? array( 'text' => $s['announcement_text'], 'url' => $s['announcement_url'] )
			: null,
		'delivery_note' => $s['delivery_note'],
	);
}
