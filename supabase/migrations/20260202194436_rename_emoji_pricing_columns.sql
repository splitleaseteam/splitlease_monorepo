-- Rename emoji pricing columns to snake_case
-- Stage 2 of database column naming migration

ALTER TABLE listing RENAME COLUMN "💰Cleaning Cost / Maintenance Fee" TO "cleaning_fee";
ALTER TABLE listing RENAME COLUMN "💰Damage Deposit" TO "damage_deposit";
ALTER TABLE listing RENAME COLUMN "💰Weekly Host Rate" TO "weekly_host_rate";
ALTER TABLE listing RENAME COLUMN "💰Monthly Host Rate" TO "monthly_host_rate";
ALTER TABLE listing RENAME COLUMN "💰Nightly Host Rate for 1 night" TO "nightly_rate_1_night";
ALTER TABLE listing RENAME COLUMN "💰Nightly Host Rate for 2 nights" TO "nightly_rate_2_nights";
ALTER TABLE listing RENAME COLUMN "💰Nightly Host Rate for 3 nights" TO "nightly_rate_3_nights";
ALTER TABLE listing RENAME COLUMN "💰Nightly Host Rate for 4 nights" TO "nightly_rate_4_nights";
ALTER TABLE listing RENAME COLUMN "💰Nightly Host Rate for 5 nights" TO "nightly_rate_5_nights";
ALTER TABLE listing RENAME COLUMN "💰Nightly Host Rate for 6 nights" TO "nightly_rate_6_nights";
ALTER TABLE listing RENAME COLUMN "💰Nightly Host Rate for 7 nights" TO "nightly_rate_7_nights";
ALTER TABLE listing RENAME COLUMN "💰Price Override" TO "price_override";
ALTER TABLE listing RENAME COLUMN "💰Unit Markup" TO "unit_markup";
ALTER TABLE listing RENAME COLUMN "💰Extra Charges" TO "extra_charges";
