/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.sql(`CREATE EXTENSION IF NOT EXISTS btree_gist;`);
    pgm.sql(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    pgm.sql(`
    CREATE TABLE IF NOT EXISTS users(
        id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    is_admin boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );
    `);

    pgm.sql(`DO $$
BEGIN
    ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
EXCEPTION
    WHEN duplicate_object OR invalid_table_definition THEN
        NULL;
END $$;`);

    pgm.sql(`DO $$
    BEGIN
    ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
    EXCEPTION
    WHEN duplicate_object OR duplicate_table THEN
    NULL;
    END $$;`);

    pgm.sql(`
        CREATE TABLE IF NOT EXISTS items (
         id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    title character varying(150) NOT NULL,
    description text NOT NULL,
    category character varying(50) NOT NULL,
    price numeric(10,2) NOT NULL,
    rental_unit character varying(10) NOT NULL,
    images text[] DEFAULT '{}'::text[],
    listing_status character varying(20) DEFAULT 'PENDING_REVIEW'::character varying NOT NULL,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    step_increment interval DEFAULT '00:30:00'::interval NOT NULL,
    buffer_duration interval DEFAULT '00:00:00'::interval NOT NULL,
    CONSTRAINT items_category_check CHECK (((category)::text = ANY ((ARRAY['Cameras'::character varying, 'Tools'::character varying, 'Gaming'::character varying, 'Vehicles'::character varying, 'Electronics'::character varying, 'Other'::character varying])::text[]))),
    CONSTRAINT items_listing_status_check CHECK (((listing_status)::text = ANY ((ARRAY['PENDING_REVIEW'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying])::text[]))),
    CONSTRAINT items_price_check CHECK ((price > (0)::numeric)),
    CONSTRAINT items_rental_unit_check CHECK (((rental_unit)::text = ANY ((ARRAY['HOURLY'::character varying, 'DAILY'::character varying])::text[])))
  )
        `);

    pgm.sql(`DO $$
BEGIN
    ALTER TABLE items ADD CONSTRAINT items_pkey PRIMARY KEY (id);
    EXCEPTION
    WHEN duplicate_object OR invalid_table_definition THEN
        NULL;
END $$;`);
    pgm.sql(
        `DO $$
BEGIN
    ALTER TABLE items ADD CONSTRAINT items_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT;
    EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;`,
    );
    pgm.sql(
        `CREATE INDEX IF NOT EXISTS idx_items_category ON items USING btree (category);`,
    );
    pgm.sql(
        `CREATE INDEX IF NOT EXISTS idx_items_listing_status ON items USING btree (listing_status);`,
    );

    pgm.sql(`
    CREATE TABLE IF NOT EXISTS booking_units (
     id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id uuid NOT NULL,
    label text NOT NULL,
    unit_status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT booking_units_unit_status_check CHECK ((unit_status = ANY (ARRAY['ACTIVE'::text, 'MAINTENANCE'::text, 'RETIRED'::text])))
    );
  `);

    pgm.sql(
        `DO $$
BEGIN
ALTER TABLE booking_units ADD CONSTRAINT booking_units_pkey PRIMARY KEY (id);
EXCEPTION
    WHEN duplicate_object OR invalid_table_definition THEN
        NULL;
END $$;`,
    );
    pgm.sql(
        `DO $$
BEGIN
ALTER TABLE booking_units ADD CONSTRAINT booking_units_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;`,
    );
    pgm.sql(
        `CREATE INDEX IF NOT EXISTS idx_booking_units_item_id ON booking_units USING btree (item_id);`,
    );

    pgm.sql(`
            CREATE TABLE IF NOT EXISTS bookings (
              id uuid DEFAULT gen_random_uuid() NOT NULL,
    unit_id uuid NOT NULL,
    renter_id uuid NOT NULL,
    booked_period tstzrange NOT NULL,
    status text DEFAULT 'REQUESTED'::text NOT NULL,
    deposit_status text DEFAULT 'HELD'::text NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    responded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bookings_deposit_status_check CHECK ((deposit_status = ANY (ARRAY['HELD'::text, 'RELEASED'::text, 'PARTIALLY_CLAIMED'::text, 'FULLY_CLAIMED'::text]))),
    CONSTRAINT bookings_status_check CHECK ((status = ANY (ARRAY['REQUESTED'::text, 'APPROVED'::text, 'REJECTED'::text, 'EXPIRED'::text, 'CONFIRMED'::text, 'PICKED_UP'::text, 'COMPLETED'::text, 'DISPUTED'::text])))
            );
            `);

    pgm.sql(
        `DO $$
BEGIN
ALTER TABLE bookings ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);
EXCEPTION
    WHEN duplicate_object OR invalid_table_definition THEN
        NULL;
END $$;`,
    );
    pgm.sql(
        `DO $$
BEGIN
ALTER TABLE bookings ADD CONSTRAINT bookings_renter_id_fkey FOREIGN KEY (renter_id) REFERENCES users(id) ON DELETE RESTRICT;
    EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;`,
    );
    pgm.sql(
        `DO $$
BEGIN
ALTER TABLE bookings ADD CONSTRAINT bookings_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES booking_units(id) ON DELETE RESTRICT;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;`,
    );
    pgm.sql(
        `DO $$
BEGIN
ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (unit_id WITH =, booked_period WITH &&) WHERE (status = ANY (ARRAY['REQUESTED'::text, 'APPROVED'::text, 'CONFIRMED'::text, 'PICKED_UP'::text]));
EXCEPTION
    WHEN duplicate_object OR duplicate_table THEN
        NULL;
END $$;`,
    );
    pgm.sql(
        `CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings USING btree (status);`,
    );
    pgm.sql(
        `CREATE INDEX IF NOT EXISTS idx_bookings_unit_id ON bookings USING btree (unit_id);`,
    );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.sql(`DROP TABLE IF EXISTS bookings;`);
    pgm.sql(`DROP TABLE IF EXISTS booking_units;`);
    pgm.sql(`DROP TABLE IF EXISTS items;`);
    pgm.sql(`DROP TABLE IF EXISTS users;`);
    pgm.sql(`DROP EXTENSION IF EXISTS pgcrypto;`);
    pgm.sql(`DROP EXTENSION IF EXISTS btree_gist;`);
};
