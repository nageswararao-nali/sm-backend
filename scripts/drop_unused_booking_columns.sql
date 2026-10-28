-- Drops the 21 `bookings` columns removed from BookingEntity because they were either
-- pure literal constants sent by customer-app, or fields whose only setter UI was removed
-- earlier in this cleanup pass.
--
-- IMPORTANT: several of these were still read by backend business logic (fare calc,
-- dispatch matching, payment attribution, tour manifests) and by manager-interface's
-- booking screens (Bookings.js, ClosedBookings.js, BookingInvoice.js, VegamEditModal.js,
-- AddBookings.js). Those consumers have NOT been updated in this pass -- that was an
-- explicit, informed decision to handle manager-interface separately. Expect manager-interface
-- to show blank/undefined values for these fields (is_vivegam toggle, loading-charge columns,
-- booking_for / "who pays" UI, vehicle type, commodity/packaging type) until it's updated.
--
-- Review this against a backup before running. Not executed automatically.

ALTER TABLE bookings
    DROP COLUMN IF EXISTS commodity_type,
    DROP COLUMN IF EXISTS commodity_whole_volume,
    DROP COLUMN IF EXISTS packaging_type,
    DROP COLUMN IF EXISTS time_interval,
    DROP COLUMN IF EXISTS assign_tour_status,
    DROP COLUMN IF EXISTS is_booking_from_app,
    DROP COLUMN IF EXISTS booking_for,
    DROP COLUMN IF EXISTS is_vivegam,
    DROP COLUMN IF EXISTS loading_charge_applicable,
    DROP COLUMN IF EXISTS unloading_charge_applicable,
    DROP COLUMN IF EXISTS both_loading_unloading_charge_applicable,
    DROP COLUMN IF EXISTS weight_unit,
    DROP COLUMN IF EXISTS volume_unit,
    DROP COLUMN IF EXISTS commodity_length,
    DROP COLUMN IF EXISTS length_unit,
    DROP COLUMN IF EXISTS commodity_breadth,
    DROP COLUMN IF EXISTS breadth_unit,
    DROP COLUMN IF EXISTS commodity_height,
    DROP COLUMN IF EXISTS height_unit,
    DROP COLUMN IF EXISTS other_commodity_name,
    DROP COLUMN IF EXISTS vehicle_type;
