-- Migration: Move all reference_table tables to public schema
-- Context: Frontend .schema('reference_table') calls removed; tables need to be in public
-- Risk: LOW - Zero naming collisions verified, metadata-only operation, fully reversible

-- 21 app-queried tables
ALTER TABLE IF EXISTS reference_table.cancellation_reasons SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.os_messaging_cta SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.os_proposal_status SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.os_slack_channels SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.os_twilio_numbers SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.zat_email_html_template_eg_sendbasicemailwf_ SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.zat_faq SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.zat_features_cancellationpolicy SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.zat_features_houserule SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.zat_features_listingtype SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.zat_features_parkingoptions SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.zat_features_safetyfeature SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.zat_features_storageoptions SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.zat_geo_borough_toplevel SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.zat_geo_hood_mediumlevel SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.zat_goodguestreasons SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.zat_location SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.zat_policiesdocuments SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.zat_priceconfiguration SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.zat_splitleaseteam SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.zat_storage SET SCHEMA public;

-- 6 FK-referenced tables (not directly queried by app but used by foreign keys)
ALTER TABLE IF EXISTS reference_table.os_user_type SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.os_weekly_selection_options SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.os_price_filter SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.os_kitchen_type SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.os_us_states SET SCHEMA public;
ALTER TABLE IF EXISTS reference_table.os_rental_type SET SCHEMA public;
