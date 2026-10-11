<?php
/**
 * Content the homepage and brand pages are built from, all managed in
 * wp-admin under Products:
 *   - Homepage slides  (bc_slide)       hero/feature slides: image or video, headline, CTA
 *   - Testimonials     (bc_testimonial) customer quotes with city and rating
 *   - Instagram posts  (bc_instagram)   a hand-curated grid (no Instagram API token needed)
 *
 * Publish/draft is the on/off switch for each; "Order" (page attributes) sets
 * the sequence.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function bc_register_content_types() {
	$common = array(
		'public'       => false,
		'show_ui'      => true,
		'show_in_menu' => 'edit.php?post_type=bc_product',
		'show_in_rest' => false,
	);
	register_post_type(
		'bc_slide',
		$common + array(
			'labels'   => array(
				'name'          => __( 'Homepage slides', 'baig-cloth-headless' ),
				'singular_name' => __( 'Slide', 'baig-cloth-headless' ),
				'add_new_item'  => __( 'Add New Slide', 'baig-cloth-headless' ),
				'edit_item'     => __( 'Edit Slide', 'baig-cloth-headless' ),
				'not_found'     => __( 'No slides yet', 'baig-cloth-headless' ),
			),
			'supports' => array( 'title', 'page-attributes' ),
		)
	);
	register_post_type(
		'bc_testimonial',
		$common + array(
			'labels'   => array(
				'name'          => __( 'Testimonials', 'baig-cloth-headless' ),
				'singular_name' => __( 'Testimonial', 'baig-cloth-headless' ),
				'add_new_item'  => __( 'Add New Testimonial', 'baig-cloth-headless' ),
				'edit_item'     => __( 'Edit Testimonial', 'baig-cloth-headless' ),
				'not_found'     => __( 'No testimonials yet', 'baig-cloth-headless' ),
			),
			'supports' => array( 'title', 'editor', 'page-attributes' ),
		)
	);
	register_post_type(
		'bc_instagram',
		$common + array(
			'labels'   => array(
				'name'          => __( 'Instagram posts', 'baig-cloth-headless' ),
				'singular_name' => __( 'Instagram post', 'baig-cloth-headless' ),
				'add_new_item'  => __( 'Add Instagram Post', 'baig-cloth-headless' ),
				'edit_item'     => __( 'Edit Instagram Post', 'baig-cloth-headless' ),
				'not_found'     => __( 'No posts yet', 'baig-cloth-headless' ),
			),
			'supports' => array( 'title', 'page-attributes' ),
		)
	);
}
add_action( 'init', 'bc_register_content_types' );

/** Field definitions per content type: key => [type, label, help]. */
function bc_content_fields( $post_type ) {
	switch ( $post_type ) {
		case 'bc_slide':
			return array(
				'_bc_subheadline' => array( 'text', __( 'Sub-headline', 'baig-cloth-headless' ), __( 'One short line under the headline.', 'baig-cloth-headless' ) ),
				'_bc_eyebrow'     => array( 'text', __( 'Eyebrow', 'baig-cloth-headless' ), __( 'Tiny label above the headline, e.g. "New in · Lawn 2026".', 'baig-cloth-headless' ) ),
				'_bc_media_type'  => array( 'select:image,video', __( 'Media', 'baig-cloth-headless' ), '' ),
				'_bc_image_url'   => array( 'media', __( 'Image URL', 'baig-cloth-headless' ), __( 'Also used as the poster while a video loads. Landscape 16:9 for desktop; the mobile crop is centred.', 'baig-cloth-headless' ) ),
				'_bc_image_mobile_url' => array( 'media', __( 'Mobile image URL (optional)', 'baig-cloth-headless' ), __( 'Portrait 4:5 version shown on phones instead of the cropped landscape image.', 'baig-cloth-headless' ) ),
				'_bc_video_url'   => array( 'media:video', __( 'Video URL', 'baig-cloth-headless' ), __( 'Short muted MP4 loop (under 20 s, under 3 MB).', 'baig-cloth-headless' ) ),
				'_bc_cta_label'   => array( 'text', __( 'Button label', 'baig-cloth-headless' ), __( 'e.g. "Shop Lawn"', 'baig-cloth-headless' ) ),
				'_bc_cta_url'     => array( 'text', __( 'Button link', 'baig-cloth-headless' ), __( 'A storefront path such as /women/lawn or /collections/lawn-2026.', 'baig-cloth-headless' ) ),
				'_bc_tone'        => array( 'select:light,dark', __( 'Text colour', 'baig-cloth-headless' ), __( 'Light text for dark footage, dark text for pale images.', 'baig-cloth-headless' ) ),
			);
		case 'bc_testimonial':
			return array(
				'_bc_city'      => array( 'text', __( 'City', 'baig-cloth-headless' ), '' ),
				'_bc_rating'    => array( 'select:5,4,3', __( 'Rating', 'baig-cloth-headless' ), '' ),
				'_bc_source'    => array( 'text', __( 'Source', 'baig-cloth-headless' ), __( 'e.g. WhatsApp, Instagram, In store', 'baig-cloth-headless' ) ),
				'_bc_photo_url' => array( 'media', __( 'Photo URL (optional)', 'baig-cloth-headless' ), __( 'A photo of the piece they bought, or of them wearing it.', 'baig-cloth-headless' ) ),
				'_bc_featured'  => array( 'checkbox', __( 'Show on homepage', 'baig-cloth-headless' ), '' ),
			);
		case 'bc_instagram':
			return array(
				'_bc_image_url' => array( 'media', __( 'Image URL', 'baig-cloth-headless' ), __( 'Square (1:1) looks best.', 'baig-cloth-headless' ) ),
				'_bc_link_url'  => array( 'text', __( 'Instagram post link', 'baig-cloth-headless' ), __( 'https://www.instagram.com/p/…', 'baig-cloth-headless' ) ),
			);
	}
	return array();
}

function bc_add_content_metaboxes() {
	foreach ( array( 'bc_slide', 'bc_testimonial', 'bc_instagram' ) as $type ) {
		add_meta_box( 'bc_content_fields', __( 'Details', 'baig-cloth-headless' ), 'bc_render_content_metabox', $type, 'normal', 'high' );
	}
}
add_action( 'add_meta_boxes', 'bc_add_content_metaboxes' );

function bc_render_content_metabox( $post ) {
	wp_nonce_field( 'bc_save_content', 'bc_content_nonce' );
	echo '<table class="form-table bc-details">';
	foreach ( bc_content_fields( $post->post_type ) as $key => list( $type, $label, $help ) ) {
		$value = get_post_meta( $post->ID, $key, true );
		$name  = 'bc_field_' . ltrim( $key, '_' );
		echo '<tr><th scope="row"><label for="' . esc_attr( $name ) . '">' . esc_html( $label ) . '</label></th><td>';
		if ( 0 === strpos( $type, 'select:' ) ) {
			$options = explode( ',', substr( $type, 7 ) );
			echo '<select name="' . esc_attr( $name ) . '" id="' . esc_attr( $name ) . '">';
			foreach ( $options as $opt ) {
				printf( '<option value="%s" %s>%s</option>', esc_attr( $opt ), selected( (string) $value, $opt, false ), esc_html( ucfirst( $opt ) ) );
			}
			echo '</select>';
		} elseif ( 'checkbox' === $type ) {
			printf( '<input type="checkbox" name="%1$s" id="%1$s" value="1" %2$s />', esc_attr( $name ), checked( $value, '1', false ) );
		} elseif ( 0 === strpos( $type, 'media' ) ) {
			$kind = 'media:video' === $type ? 'video' : 'image';
			printf( '<input type="text" name="%1$s" id="%1$s" value="%2$s" class="regular-text bc-media-url" data-media="%3$s" />', esc_attr( $name ), esc_attr( $value ), esc_attr( $kind ) );
		} else {
			printf( '<input type="text" name="%1$s" id="%1$s" value="%2$s" class="regular-text" />', esc_attr( $name ), esc_attr( $value ) );
		}
		if ( $help ) {
			echo '<p class="description">' . esc_html( $help ) . '</p>';
		}
		echo '</td></tr>';
	}
	echo '</table>';
	if ( 'bc_slide' === $post->post_type ) {
		echo '<p class="description">' . esc_html__( 'The slide title is the headline. Publish to show it; save as draft to hide it. "Order" in the sidebar sets the sequence.', 'baig-cloth-headless' ) . '</p>';
	}
	if ( 'bc_testimonial' === $post->post_type ) {
		echo '<p class="description">' . esc_html__( 'The title is the customer\'s name (first name is enough); the editor holds the quote.', 'baig-cloth-headless' ) . '</p>';
	}
}

function bc_save_content_metabox( $post_id, $post ) {
	$fields = bc_content_fields( $post->post_type );
	if ( ! $fields || ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) ) {
		return;
	}
	if ( ! isset( $_POST['bc_content_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['bc_content_nonce'] ), 'bc_save_content' ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	foreach ( $fields as $key => list( $type ) ) {
		$name = 'bc_field_' . ltrim( $key, '_' );
		if ( 'checkbox' === $type ) {
			update_post_meta( $post_id, $key, ! empty( $_POST[ $name ] ) ? '1' : '0' );
			continue;
		}
		if ( ! isset( $_POST[ $name ] ) ) {
			continue;
		}
		$raw = wp_unslash( $_POST[ $name ] );
		if ( 0 === strpos( $type, 'select:' ) ) {
			$options = explode( ',', substr( $type, 7 ) );
			$value   = in_array( $raw, $options, true ) ? $raw : $options[0];
		} elseif ( 0 === strpos( $type, 'media' ) ) {
			$value = bc_sanitize_image_url( $raw );
		} elseif ( '_bc_link_url' === $key ) {
			$value = esc_url_raw( $raw, array( 'http', 'https' ) );
		} else {
			$value = sanitize_text_field( $raw );
		}
		update_post_meta( $post_id, $key, $value );
	}
}
add_action( 'save_post', 'bc_save_content_metabox', 10, 2 );

// ---------------------------------------------------------------------------
// Admin list columns
// ---------------------------------------------------------------------------

function bc_content_columns( $columns ) {
	$screen = get_current_screen();
	$type   = $screen ? $screen->post_type : '';
	$out    = array( 'cb' => $columns['cb'] );
	if ( 'bc_slide' === $type || 'bc_instagram' === $type ) {
		$out['bc_thumb'] = __( 'Image', 'baig-cloth-headless' );
	}
	$out['title'] = $columns['title'];
	if ( 'bc_slide' === $type ) {
		$out['bc_meta'] = __( 'Media / button', 'baig-cloth-headless' );
	} elseif ( 'bc_testimonial' === $type ) {
		$out['bc_meta'] = __( 'City / rating', 'baig-cloth-headless' );
	} elseif ( 'bc_instagram' === $type ) {
		$out['bc_meta'] = __( 'Link', 'baig-cloth-headless' );
	}
	$out['bc_order'] = __( 'Order', 'baig-cloth-headless' );
	$out['date']     = $columns['date'];
	return $out;
}
foreach ( array( 'bc_slide', 'bc_testimonial', 'bc_instagram' ) as $bc_type ) {
	add_filter( "manage_{$bc_type}_posts_columns", 'bc_content_columns' );
}

function bc_content_column( $column, $post_id ) {
	$type = get_post_type( $post_id );
	if ( 'bc_thumb' === $column ) {
		$url = get_post_meta( $post_id, '_bc_image_url', true );
		echo $url ? '<img src="' . esc_url( bc_display_image_url( $url ) ) . '" alt="" style="width:64px;height:40px;object-fit:cover;border-radius:4px" />' : '&mdash;';
	} elseif ( 'bc_order' === $column ) {
		echo esc_html( get_post_field( 'menu_order', $post_id ) );
	} elseif ( 'bc_meta' === $column ) {
		if ( 'bc_slide' === $type ) {
			echo esc_html( get_post_meta( $post_id, '_bc_media_type', true ) ?: 'image' );
			$cta = get_post_meta( $post_id, '_bc_cta_label', true );
			if ( $cta ) {
				echo ' · ' . esc_html( $cta ) . ' → ' . esc_html( get_post_meta( $post_id, '_bc_cta_url', true ) );
			}
		} elseif ( 'bc_testimonial' === $type ) {
			echo esc_html( get_post_meta( $post_id, '_bc_city', true ) ) . ' · ' . esc_html( str_repeat( '★', (int) ( get_post_meta( $post_id, '_bc_rating', true ) ?: 5 ) ) );
			if ( '1' === get_post_meta( $post_id, '_bc_featured', true ) ) {
				echo ' · <strong>' . esc_html__( 'homepage', 'baig-cloth-headless' ) . '</strong>';
			}
		} elseif ( 'bc_instagram' === $type ) {
			$link = get_post_meta( $post_id, '_bc_link_url', true );
			echo $link ? '<a href="' . esc_url( $link ) . '" target="_blank" rel="noopener">' . esc_html( wp_parse_url( $link, PHP_URL_PATH ) ) . '</a>' : '&mdash;';
		}
	}
}
foreach ( array( 'bc_slide', 'bc_testimonial', 'bc_instagram' ) as $bc_type ) {
	add_action( "manage_{$bc_type}_posts_custom_column", 'bc_content_column', 10, 2 );
}

// ---------------------------------------------------------------------------
// Serializers
// ---------------------------------------------------------------------------

function bc_content_query( $type, $limit = 50 ) {
	return get_posts(
		array(
			'post_type'      => $type,
			'post_status'    => 'publish',
			'posts_per_page' => $limit,
			'orderby'        => array( 'menu_order' => 'ASC', 'date' => 'DESC' ),
			'no_found_rows'  => true,
		)
	);
}

function bc_get_slides() {
	$out = array();
	foreach ( bc_content_query( 'bc_slide', 10 ) as $post ) {
		$id    = $post->ID;
		$out[] = array(
			'id'           => (int) $id,
			'headline'     => wp_specialchars_decode( $post->post_title, ENT_QUOTES ),
			'subheadline'  => (string) get_post_meta( $id, '_bc_subheadline', true ),
			'eyebrow'      => (string) get_post_meta( $id, '_bc_eyebrow', true ),
			'media_type'   => get_post_meta( $id, '_bc_media_type', true ) === 'video' ? 'video' : 'image',
			'image'        => (string) get_post_meta( $id, '_bc_image_url', true ),
			'image_mobile' => (string) get_post_meta( $id, '_bc_image_mobile_url', true ),
			'video'        => (string) get_post_meta( $id, '_bc_video_url', true ),
			'cta_label'    => (string) get_post_meta( $id, '_bc_cta_label', true ),
			'cta_url'      => (string) get_post_meta( $id, '_bc_cta_url', true ),
			'tone'         => get_post_meta( $id, '_bc_tone', true ) === 'dark' ? 'dark' : 'light',
		);
	}
	return $out;
}

function bc_get_testimonials( $featured_only = false, $limit = 50 ) {
	$out = array();
	foreach ( bc_content_query( 'bc_testimonial', $limit ) as $post ) {
		$id       = $post->ID;
		$featured = '1' === get_post_meta( $id, '_bc_featured', true );
		if ( $featured_only && ! $featured ) {
			continue;
		}
		$out[] = array(
			'id'       => (int) $id,
			'name'     => wp_specialchars_decode( $post->post_title, ENT_QUOTES ),
			'quote'    => trim( wp_strip_all_tags( $post->post_content ) ),
			'city'     => (string) get_post_meta( $id, '_bc_city', true ),
			'rating'   => (int) ( get_post_meta( $id, '_bc_rating', true ) ?: 5 ),
			'source'   => (string) get_post_meta( $id, '_bc_source', true ),
			'photo'    => (string) get_post_meta( $id, '_bc_photo_url', true ),
			'featured' => $featured,
		);
	}
	return $out;
}

function bc_get_instagram( $limit = 12 ) {
	$out = array();
	foreach ( bc_content_query( 'bc_instagram', $limit ) as $post ) {
		$id    = $post->ID;
		$out[] = array(
			'id'      => (int) $id,
			'caption' => wp_specialchars_decode( $post->post_title, ENT_QUOTES ),
			'image'   => (string) get_post_meta( $id, '_bc_image_url', true ),
			'link'    => (string) get_post_meta( $id, '_bc_link_url', true ),
		);
	}
	return $out;
}

// Shared admin field helpers (media picker, row repeaters) on every plugin screen.
function bc_shared_admin_assets( $hook ) {
	$screen = get_current_screen();
	if ( ! $screen ) {
		return;
	}
	$ours = in_array( $screen->post_type, array( 'bc_product', 'bc_slide', 'bc_testimonial', 'bc_instagram' ), true )
		|| in_array( $screen->taxonomy, array( 'bc_collection', 'bc_category' ), true );
	if ( ! $ours ) {
		return;
	}
	wp_enqueue_media();
	wp_enqueue_script( 'bc-fields', BC_HEADLESS_URL . 'admin/fields.js', array( 'jquery' ), BC_HEADLESS_VERSION, true );
	wp_enqueue_style( 'bc-metabox', BC_HEADLESS_URL . 'admin/metabox.css', array(), BC_HEADLESS_VERSION );
}
add_action( 'admin_enqueue_scripts', 'bc_shared_admin_assets' );
