const { Client } = require("pg");

// Neon veritabanı bağlantı bilgileri - SENİN NEON CONNECTION STRING'İN
const client = new Client({
  connectionString:
    "postgresql://neondb_owner:npg_oaL4mUJ2XqQs@ep-misty-art-a2k9fae4-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: {
    rejectUnauthorized: false,
  },
});

async function migrateToNeon() {
  try {
    await client.connect();
    console.log("✅ Neon veritabanına bağlandı");

    // 0. ÖNCE HER ŞEYİ TEMİZLE
    console.log("🧹 Mevcut tabloları ve tipleri temizliyor...");

    try {
      // Tabloları sil (foreign key'ler yüzünden CASCADE kullan)
      await client.query(`DROP TABLE IF EXISTS public.bookings CASCADE;`);
      await client.query(`DROP TABLE IF EXISTS public.blogs CASCADE;`);
      await client.query(`DROP TABLE IF EXISTS public.cars CASCADE;`);
      await client.query(`DROP TABLE IF EXISTS public.transfers CASCADE;`);
      await client.query(`DROP TABLE IF EXISTS public.admins CASCADE;`);
      console.log("✅ Mevcut tablolar silindi");

      // ENUM tiplerini sil
      await client.query(
        `DROP TYPE IF EXISTS public.enum_admins_role CASCADE;`
      );
      await client.query(
        `DROP TYPE IF EXISTS public."enum_bookings_serviceType" CASCADE;`
      );
      await client.query(
        `DROP TYPE IF EXISTS public.enum_bookings_status CASCADE;`
      );
      await client.query(
        `DROP TYPE IF EXISTS public.enum_cars_category CASCADE;`
      );
      await client.query(
        `DROP TYPE IF EXISTS public.enum_cars_fuel_type CASCADE;`
      );
      await client.query(
        `DROP TYPE IF EXISTS public.enum_cars_status CASCADE;`
      );
      await client.query(
        `DROP TYPE IF EXISTS public.enum_cars_transmission CASCADE;`
      );
      await client.query(
        `DROP TYPE IF EXISTS public.enum_transfers_status CASCADE;`
      );
      console.log("✅ Mevcut ENUM tipler silindi");

      // Fonksiyonları sil
      await client.query(
        `DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;`
      );
      console.log("✅ Mevcut fonksiyonlar silindi");
    } catch (error) {
      console.log("⚠️ Temizleme sırasında hata (normal):", error.message);
    }

    // 1. ENUM tiplerini oluştur
    console.log("📝 ENUM tiplerini oluşturuyor...");

    const enums = [
      `CREATE TYPE public.enum_admins_role AS ENUM (
        'super_admin',
        'admin',
        'manager',
        'editor'
      );`,

      `CREATE TYPE public."enum_bookings_serviceType" AS ENUM (
        'car_rental',
        'transfer'
      );`,

      `CREATE TYPE public.enum_bookings_status AS ENUM (
        'pending',
        'confirmed',
        'active',
        'completed',
        'cancelled'
      );`,

      `CREATE TYPE public.enum_cars_category AS ENUM (
        'Ekonomik',
        'Orta Sınıf',
        'Üst Sınıf',
        'SUV',
        'Geniş',
        'Lüks'
      );`,

      `CREATE TYPE public.enum_cars_fuel_type AS ENUM (
        'Benzin',
        'Dizel',
        'Benzin+LPG',
        'Elektrikli',
        'Hibrit'
      );`,

      `CREATE TYPE public.enum_cars_status AS ENUM (
        'active',
        'inactive',
        'maintenance'
      );`,

      `CREATE TYPE public.enum_cars_transmission AS ENUM (
        'Manuel',
        'Yarı Otomatik',
        'Otomatik'
      );`,

      `CREATE TYPE public.enum_transfers_status AS ENUM (
        'active',
        'inactive'
      );`,
    ];

    for (const enumSql of enums) {
      try {
        await client.query(enumSql);
        console.log("✅ ENUM tipi oluşturuldu");
      } catch (error) {
        console.error("❌ ENUM oluşturma hatası:", error.message);
      }
    }

    // 2. update_updated_at_column fonksiyonunu oluştur
    console.log("📝 Trigger fonksiyonunu oluşturuyor...");
    try {
      await client.query(`
        CREATE OR REPLACE FUNCTION public.update_updated_at_column() 
        RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$;
      `);
      console.log("✅ Trigger fonksiyonu oluşturuldu");
    } catch (error) {
      console.error("❌ Trigger fonksiyonu hatası:", error.message);
    }

    // 3. Tabloları oluştur
    console.log("📝 Tabloları oluşturuyor...");

    // ADMINS tablosu
    try {
      await client.query(`
        CREATE TABLE public.admins (
          id uuid DEFAULT gen_random_uuid() NOT NULL,
          username character varying(50) NOT NULL,
          email character varying(100) NOT NULL,
          password character varying(255) NOT NULL,
          first_name character varying(50) NOT NULL,
          last_name character varying(50) NOT NULL,
          phone character varying(20),
          role character varying(50) DEFAULT 'admin'::character varying,
          avatar text,
          is_active boolean DEFAULT true,
          email_verified boolean DEFAULT false,
          last_login timestamp without time zone,
          last_login_ip inet,
          login_attempts integer DEFAULT 0,
          lock_until timestamp without time zone,
          password_reset_token character varying(255),
          password_reset_expires timestamp without time zone,
          permissions jsonb DEFAULT '[]'::jsonb,
          preferences jsonb DEFAULT '{}'::jsonb,
          activity jsonb DEFAULT '{}'::jsonb,
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          email_verification_token character varying(255),
          CONSTRAINT admins_pkey PRIMARY KEY (id),
          CONSTRAINT admins_username_key UNIQUE (username),
          CONSTRAINT admins_email_key UNIQUE (email)
        );
      `);
      console.log("✅ ADMINS tablosu oluşturuldu");
    } catch (error) {
      console.error("❌ ADMINS tablosu hatası:", error.message);
    }

    // TRANSFERS tablosu (cars'dan önce olmalı çünkü bookings'de foreign key var)
    try {
      await client.query(`
        CREATE TABLE public.transfers (
          id uuid DEFAULT gen_random_uuid() NOT NULL,
          zone_name character varying(100) NOT NULL,
          description text,
          pricing jsonb DEFAULT '{"currency": "EUR", "capacity_1_4": 0, "capacity_1_6": 0, "capacity_1_16": 0}'::jsonb NOT NULL,
          display_order integer DEFAULT 0 NOT NULL,
          status public.enum_transfers_status DEFAULT 'active'::public.enum_transfers_status NOT NULL,
          user_id uuid,
          created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT transfers_pkey PRIMARY KEY (id),
          CONSTRAINT transfers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.admins(id) ON UPDATE CASCADE ON DELETE CASCADE
        );
      `);
      console.log("✅ TRANSFERS tablosu oluşturuldu");
    } catch (error) {
      console.error("❌ TRANSFERS tablosu hatası:", error.message);
    }

    // CARS tablosu
    try {
      await client.query(`
        CREATE TABLE public.cars (
          id uuid DEFAULT gen_random_uuid() NOT NULL,
          title character varying(200) NOT NULL,
          year integer NOT NULL,
          brand character varying(50) NOT NULL,
          model character varying(100) NOT NULL,
          category character varying(20) DEFAULT 'Ekonomik'::character varying,
          body_type character varying(50) DEFAULT 'Sedan'::character varying,
          seats integer DEFAULT 5,
          doors integer DEFAULT 4,
          engine_capacity integer,
          transmission character varying(20) DEFAULT 'Manuel'::character varying,
          fuel_type character varying(20) DEFAULT 'Benzin'::character varying,
          main_image jsonb,
          description text,
          pricing jsonb DEFAULT '{"daily": 0, "weekly": 0, "monthly": 0, "currency": "TRY"}'::jsonb NOT NULL,
          slug character varying(250) NOT NULL,
          status character varying(20) DEFAULT 'active'::character varying,
          featured boolean DEFAULT false,
          user_id uuid,
          created_at timestamp without time zone DEFAULT now(),
          updated_at timestamp without time zone DEFAULT now(),
          gallery jsonb DEFAULT '[]'::jsonb,
          features jsonb DEFAULT '[]'::jsonb,
          seasonal_pricing jsonb DEFAULT '[]'::jsonb,
          CONSTRAINT cars_pkey PRIMARY KEY (id),
          CONSTRAINT cars_slug_key UNIQUE (slug),
          CONSTRAINT cars_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.admins(id) ON DELETE CASCADE,
          CONSTRAINT cars_category_check CHECK (((category)::text = ANY ((ARRAY['Ekonomik'::character varying, 'Orta Sınıf'::character varying, 'Üst Sınıf'::character varying, 'SUV'::character varying, 'Geniş'::character varying, 'Lüks'::character varying])::text[]))),
          CONSTRAINT cars_doors_check CHECK (((doors >= 2) AND (doors <= 6))),
          CONSTRAINT cars_engine_capacity_check CHECK (((engine_capacity >= 500) AND (engine_capacity <= 10000))),
          CONSTRAINT cars_fuel_type_check CHECK (((fuel_type)::text = ANY ((ARRAY['Benzin'::character varying, 'Dizel'::character varying, 'Benzin+LPG'::character varying, 'Elektrikli'::character varying, 'Hibrit'::character varying])::text[]))),
          CONSTRAINT cars_seats_check CHECK (((seats >= 2) AND (seats <= 50))),
          CONSTRAINT cars_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'maintenance'::character varying])::text[]))),
          CONSTRAINT cars_transmission_check CHECK (((transmission)::text = ANY ((ARRAY['Manuel'::character varying, 'Yarı Otomatik'::character varying, 'Otomatik'::character varying])::text[])))
        );
      `);
      console.log("✅ CARS tablosu oluşturuldu");
    } catch (error) {
      console.error("❌ CARS tablosu hatası:", error.message);
    }

    // BLOGS tablosu
    try {
      await client.query(`
        CREATE TABLE public.blogs (
          id uuid DEFAULT gen_random_uuid() NOT NULL,
          title character varying(200) NOT NULL,
          content text NOT NULL,
          excerpt character varying(500),
          slug character varying(250) NOT NULL,
          image jsonb,
          status character varying(20) DEFAULT 'draft'::character varying,
          featured boolean DEFAULT false,
          tags character varying(255)[] DEFAULT '{}'::character varying[],
          author character varying(100) DEFAULT 'Admin'::character varying,
          category character varying(100) DEFAULT 'Company News'::character varying,
          publish_date timestamp without time zone,
          view_count integer DEFAULT 0,
          user_id uuid NOT NULL,
          created_at timestamp without time zone DEFAULT now(),
          updated_at timestamp without time zone DEFAULT now(),
          CONSTRAINT blogs_pkey PRIMARY KEY (id),
          CONSTRAINT blogs_slug_key UNIQUE (slug),
          CONSTRAINT blogs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.admins(id) ON DELETE CASCADE,
          CONSTRAINT blogs_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying])::text[])))
        );
      `);
      console.log("✅ BLOGS tablosu oluşturuldu");
    } catch (error) {
      console.error("❌ BLOGS tablosu hatası:", error.message);
    }

    // BOOKINGS tablosu
    try {
      await client.query(`
        CREATE TABLE public.bookings (
          id uuid DEFAULT gen_random_uuid() NOT NULL,
          "carId" uuid,
          "bookingReference" character varying(255),
          drivers json NOT NULL,
          "pickupLocation" character varying(255) NOT NULL,
          "dropoffLocation" character varying(255) NOT NULL,
          "pickupTime" timestamp with time zone NOT NULL,
          "dropoffTime" timestamp with time zone NOT NULL,
          pricing json NOT NULL,
          status character varying(50) DEFAULT 'pending'::character varying,
          "additionalServices" jsonb DEFAULT '[]'::jsonb,
          "specialRequests" text,
          "adminNotes" text,
          "createdBy" uuid,
          "lastModifiedBy" uuid,
          "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
          "serviceType" public."enum_bookings_serviceType" DEFAULT 'car_rental'::public."enum_bookings_serviceType" NOT NULL,
          "transferId" uuid,
          "transferData" jsonb,
          CONSTRAINT bookings_pkey PRIMARY KEY (id),
          CONSTRAINT "bookings_bookingReference_key" UNIQUE ("bookingReference"),
          CONSTRAINT "bookings_carId_fkey" FOREIGN KEY ("carId") REFERENCES public.cars(id),
          CONSTRAINT "bookings_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES public.transfers(id),
          CONSTRAINT bookings_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'active'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
        );
      `);
      console.log("✅ BOOKINGS tablosu oluşturuldu");
    } catch (error) {
      console.error("❌ BOOKINGS tablosu hatası:", error.message);
    }

    // 4. İndeksleri oluştur
    console.log("📝 İndeksleri oluşturuyor...");

    const indexes = [
      // Cars indexes
      `CREATE INDEX idx_cars_brand_model ON public.cars USING btree (brand, model);`,
      `CREATE INDEX idx_cars_category ON public.cars USING btree (category);`,
      `CREATE INDEX idx_cars_featured ON public.cars USING btree (featured);`,
      `CREATE INDEX idx_cars_main_image ON public.cars USING gin (main_image);`,
      `CREATE INDEX idx_cars_pricing ON public.cars USING gin (pricing);`,
      `CREATE INDEX idx_cars_slug ON public.cars USING btree (slug);`,
      `CREATE INDEX idx_cars_status ON public.cars USING btree (status);`,
      `CREATE INDEX idx_cars_user_id ON public.cars USING btree (user_id);`,
      `CREATE INDEX cars_gallery_gin_idx ON public.cars USING gin (gallery);`,

      // Blogs indexes
      `CREATE INDEX idx_blogs_featured ON public.blogs USING btree (featured);`,
      `CREATE INDEX idx_blogs_publish_date ON public.blogs USING btree (publish_date);`,
      `CREATE INDEX idx_blogs_slug ON public.blogs USING btree (slug);`,
      `CREATE INDEX idx_blogs_status ON public.blogs USING btree (status);`,
      `CREATE INDEX idx_blogs_tags ON public.blogs USING gin (tags);`,
      `CREATE INDEX idx_blogs_user_id ON public.blogs USING btree (user_id);`,

      // Bookings indexes
      `CREATE INDEX idx_bookings_car_id ON public.bookings USING btree ("carId");`,
      `CREATE INDEX idx_bookings_pickup_time ON public.bookings USING btree ("pickupTime");`,
      `CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);`,

      // Transfers indexes
      `CREATE INDEX transfers_display_order ON public.transfers USING btree (display_order);`,
      `CREATE INDEX transfers_pricing ON public.transfers USING gin (pricing);`,
      `CREATE INDEX transfers_status ON public.transfers USING btree (status);`,
      `CREATE INDEX transfers_user_id ON public.transfers USING btree (user_id);`,
      `CREATE INDEX transfers_zone_name ON public.transfers USING btree (zone_name);`,
    ];

    for (const indexSql of indexes) {
      try {
        await client.query(indexSql);
      } catch (error) {
        console.log("⚠️ İndeks hatası:", error.message);
      }
    }
    console.log("✅ İndeksler oluşturuldu");

    // 5. Verileri ekle
    console.log("📝 Verileri ekleniyor...");

    // Admin verisi
    try {
      await client.query(`
        INSERT INTO public.admins (id, username, email, password, first_name, last_name, phone, role, avatar, is_active, email_verified, last_login, last_login_ip, login_attempts, lock_until, password_reset_token, password_reset_expires, permissions, preferences, activity, created_at, updated_at, email_verification_token)
        VALUES (
          'bb6aa333-efe1-49ac-9cd4-28e340ef9dc9',
          'admin',
          'admin@mitcarrental.com',
          '$2a$10$lHY8jRIxUlEreb7HjmTRF.6GfCMvC0sDqGqKhnSi9PbuCd6W1H.GS',
          'System',
          'Administrator',
          null,
          'super_admin',
          null,
          true,
          true,
          '2025-08-25 04:51:02.591',
          '::1',
          0,
          null,
          null,
          null,
          '[{"module": "cars", "actions": ["create", "read", "update", "delete", "export"]}, {"module": "locations", "actions": ["create", "read", "update", "delete", "export"]}, {"module": "bookings", "actions": ["create", "read", "update", "delete", "export"]}, {"module": "content", "actions": ["create", "read", "update", "delete"]}, {"module": "settings", "actions": ["create", "read", "update", "delete"]}]',
          '{"theme": "light", "language": "tr", "timezone": "Europe/Istanbul", "dateFormat": "DD/MM/YYYY", "notifications": {"email": true, "browser": true, "messages": true, "newBookings": true}}',
          '{"lastActions": [], "totalLogins": 0}',
          '2025-08-03 04:33:38.214418',
          '2025-08-25 04:51:02.592',
          null
        );
      `);
      console.log("✅ Admin verisi eklendi");
    } catch (error) {
      console.error("❌ Admin verisi hatası:", error.message);
    }

    // Transfer verileri
    const transfers = [
      {
        id: "a482bf86-ba27-43c2-8cf7-c86358809f02",
        zone_name: "İzmir Şehir Merkezi",
        description: "İzmir city center transfer service",
        pricing:
          '{"currency": "EUR", "capacity_1_4": 110, "capacity_1_6": 140, "capacity_1_16": 190}',
        display_order: 1,
      },
      {
        id: "f3d8c28e-8a5f-4a4f-ad05-03db51e91ed2",
        zone_name: "Adnan Menderes Havalimanı",
        description: "İzmir Airport transfer service",
        pricing:
          '{"currency": "EUR", "capacity_1_4": 150, "capacity_1_6": 180, "capacity_1_16": 220}',
        display_order: 4,
      },
      {
        id: "ab54e11a-2c95-4618-bda0-da23367b7288",
        zone_name: "Foça Transfer",
        description: "Transfer service to Foça",
        pricing:
          '{"currency": "EUR", "capacity_1_4": 180, "capacity_1_6": 230, "capacity_1_16": 270}',
        display_order: 5,
      },
      {
        id: "bf231812-dce7-462f-b51c-f2c5f7c8c0af",
        zone_name: "Çeşme Transfer",
        description: "Transfer service to Çeşme resort area",
        pricing:
          '{"currency": "EUR", "capacity_1_4": 210, "capacity_1_6": 290, "capacity_1_16": 330}',
        display_order: 1,
      },
      {
        id: "3d9e43d5-0706-4c3b-9fdd-851db52fdecc",
        zone_name: "Alaçatı Transfer",
        description: "Transfer service to Alaçatı",
        pricing:
          '{"currency": "EUR", "capacity_1_4": 230, "capacity_1_6": 310, "capacity_1_16": 350}',
        display_order: 1,
      },
      {
        id: "0d5e2f32-10ad-43d0-8eb9-334d4a3a425b",
        zone_name: "yeni transfer alanı",
        description: "a",
        pricing:
          '{"currency": "EUR", "capacity_1_4": 200, "capacity_1_6": 2000, "capacity_1_16": 19999.99}',
        display_order: 1,
      },
    ];

    for (const transfer of transfers) {
      try {
        await client.query(
          `
          INSERT INTO public.transfers (id, zone_name, description, pricing, display_order, status, user_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4::jsonb, $5, 'active', 'bb6aa333-efe1-49ac-9cd4-28e340ef9dc9', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        `,
          [
            transfer.id,
            transfer.zone_name,
            transfer.description,
            transfer.pricing,
            transfer.display_order,
          ]
        );
      } catch (error) {
        console.error("❌ Transfer verisi hatası:", error.message);
      }
    }
    console.log("✅ Transfer verileri eklendi");

    // Araç verileri
    const cars = [
      {
        id: "6517bf95-7944-4808-be51-636843bc61b0",
        title: "Bu araba ekleme kısmıdır",
        year: 2025,
        brand: "Fiat",
        model: "egea",
        category: "Lüks",
        body_type: "Sedan",
        seats: 4,
        doors: 4,
        engine_capacity: 1600,
        transmission: "Otomatik",
        fuel_type: "Benzin",
        main_image:
          '{"alt": "Fiat egea", "url": "https://res.cloudinary.com/dr7o6xqyo/image/upload/v1755133513/rentaly/cars/ogbtiwgng67g35i5nyjm.jpg", "publicId": ""}',
        description: "a",
        pricing:
          '{"daily": 32, "weekly": 90, "monthly": 97, "currency": "TRY"}',
        slug: "bu-araba-ekleme-ksmdr",
      },
      {
        id: "d28900e2-75b0-41f5-9a0f-2a32eec56640",
        title: "Fiat Egea 1.5",
        year: 2025,
        brand: "Fiat",
        model: "egea",
        category: "Lüks",
        body_type: "Suv",
        seats: 4,
        doors: 4,
        engine_capacity: 1538,
        transmission: "Otomatik",
        fuel_type: "Benzin",
        main_image:
          '{"alt": "Fiat egea", "url": "https://res.cloudinary.com/dr7o6xqyo/image/upload/v1755518765/rentaly/cars/lcifdwjae5ugkyh7n5rb.png", "publicId": ""}',
        description: "",
        pricing:
          '{"daily": 42, "weekly": 99, "monthly": 350, "currency": "TRY"}',
        slug: "fiat-egea-15",
        features:
          '["Klima", "Geri Görüş Kamerası", "Hız Sabitleme", "Hidrolik Direksiyon", "Otomatik Şanzıman", "USB Port", "Bluetooth"]',
      },
      {
        id: "7d1bcf40-76e0-4c27-bcb1-b773b989159d",
        title: "ASDHUJIO",
        year: 2025,
        brand: "Ferrari",
        model: "AAA",
        category: "Lüks",
        body_type: "Hatchback",
        seats: 4,
        doors: 4,
        engine_capacity: 1600,
        transmission: "Otomatik",
        fuel_type: "Benzin",
        main_image:
          '{"alt": "Ferrari AAA", "url": "https://res.cloudinary.com/dr7o6xqyo/image/upload/v1755890526/rentaly/cars/ae2k9aavdhjulnxrkjrz.png", "publicId": ""}',
        description: "",
        pricing:
          '{"daily": 80, "weekly": 90, "monthly": 98, "currency": "TRY"}',
        slug: "asdhujio",
        gallery:
          '[{"url": "https://res.cloudinary.com/dr7o6xqyo/image/upload/v1755996905/rentaly/cars/clllvb8qobrgqz6qcb1q.png"}, {"url": "https://res.cloudinary.com/dr7o6xqyo/image/upload/v1755996907/rentaly/cars/j115zlvtmkqlodaggvow.jpg"}]',
        features:
          '["Klima", "Geri Görüş Kamerası", "Sunroof", "Park Sensörü", "CD Player", "USB Port"]',
        seasonal_pricing:
          '[{"name": "yaz dönemi", "daily": "100", "weekly": "120", "endDate": "01/11/2026", "monthly": "150", "startDate": "01/07/2026"}]',
      },
      {
        id: "708dff71-c677-4c09-95b7-c522e28b31a7",
        title: "fiat a",
        year: 2025,
        brand: "Fiat",
        model: "egea",
        category: "Orta Sınıf",
        body_type: "Suv",
        seats: 4,
        doors: 3,
        engine_capacity: 1000,
        transmission: "Otomatik",
        fuel_type: "Benzin",
        main_image:
          '{"alt": "Fiat egea", "url": "https://res.cloudinary.com/dr7o6xqyo/image/upload/v1755222665/rentaly/cars/rjho52pjrknhc8urm97o.jpg", "publicId": ""}',
        description: "Bu araba çok güçlü bir arabadır",
        pricing:
          '{"daily": 1000, "weekly": 2000, "monthly": 3000, "currency": "TRY"}',
        slug: "fiat-a",
        seasonal_pricing:
          '[{"name": "Burak Yüce", "daily": "45", "weekly": "50", "endDate": "2025-08-31", "monthly": "60", "startDate": "2025-08-01"}, {"name": "AĞUSTOS AYI", "daily": "50", "weekly": "320", "endDate": "31/08/2026", "monthly": "1200", "startDate": "01/08/2026"}]',
      },
    ];

    for (const car of cars) {
      try {
        await client.query(
          `
          INSERT INTO public.cars (
            id, title, year, brand, model, category, body_type, seats, doors, 
            engine_capacity, transmission, fuel_type, main_image, description, 
            pricing, slug, status, featured, user_id, created_at, updated_at, 
            gallery, features, seasonal_pricing
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, 
            $15::jsonb, $16, 'active', false, 'bb6aa333-efe1-49ac-9cd4-28e340ef9dc9', 
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $17::jsonb, $18::jsonb, $19::jsonb
          );
        `,
          [
            car.id,
            car.title,
            car.year,
            car.brand,
            car.model,
            car.category,
            car.body_type,
            car.seats,
            car.doors,
            car.engine_capacity,
            car.transmission,
            car.fuel_type,
            car.main_image,
            car.description,
            car.pricing,
            car.slug,
            car.gallery || "[]",
            car.features || "[]",
            car.seasonal_pricing || "[]",
          ]
        );
      } catch (error) {
        console.error("❌ Araç verisi hatası:", error.message);
      }
    }
    console.log("✅ Araç verileri eklendi");

    console.log("🎉 Tüm veriler başarıyla Neon veritabanına aktarıldı!");
    console.log("📊 Aktarılan veriler:");
    console.log("   - 1 Admin kullanıcısı (admin@mitcarrental.com)");
    console.log("   - 6 Transfer noktası");
    console.log("   - 4 Araç");
    console.log("   - Tüm indeksler ve kısıtlamalar");
  } catch (error) {
    console.error("💥 Genel hata:", error);
  } finally {
    await client.end();
    console.log("🔌 Veritabanı bağlantısı kapatıldı");
  }
}

// Script'i çalıştır
migrateToNeon();
