// Türk pazarına yönelik araç verisi
// Yapı: { marka, modeller: [{ ad, tip, versiyonlar: [{ ad, yakit, vites, motor }] }] }

const CAR_DATA = [
    {
        marka: "Audi",
        modeller: [
            { ad: "A3", tip: "Otomobil", versiyonlar: [
                    { ad: "1.0 TFSI", yakit: "Benzin", vites: "Otomatik", motor: "1.0" },
                    { ad: "1.5 TFSI", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "2.0 TDI", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "35 TFSI", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "40 TFSI e-tron", yakit: "Hibrit", vites: "Otomatik", motor: "1.4" },
                ]},
            { ad: "A4", tip: "Otomobil", versiyonlar: [
                    { ad: "1.4 TFSI", yakit: "Benzin", vites: "Otomatik", motor: "1.4" },
                    { ad: "2.0 TFSI", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                    { ad: "2.0 TDI", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "3.0 TDI", yakit: "Dizel", vites: "Otomatik", motor: "3.0" },
                    { ad: "35 TFSI", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                    { ad: "40 TDI", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                ]},
            { ad: "A6", tip: "Otomobil", versiyonlar: [
                    { ad: "2.0 TFSI", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                    { ad: "3.0 TFSI", yakit: "Benzin", vites: "Otomatik", motor: "3.0" },
                    { ad: "2.0 TDI", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "3.0 TDI", yakit: "Dizel", vites: "Otomatik", motor: "3.0" },
                    { ad: "40 TFSI", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                    { ad: "55 TFSI e-tron", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                ]},
            { ad: "Q3", tip: "SUV", versiyonlar: [
                    { ad: "1.4 TFSI", yakit: "Benzin", vites: "Otomatik", motor: "1.4" },
                    { ad: "2.0 TDI", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "35 TFSI", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "35 TDI", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                ]},
            { ad: "Q5", tip: "SUV", versiyonlar: [
                    { ad: "2.0 TFSI", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                    { ad: "2.0 TDI", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "40 TFSI", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                    { ad: "40 TDI", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "55 TFSI e", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                ]},
            { ad: "Q7", tip: "SUV", versiyonlar: [
                    { ad: "3.0 TFSI", yakit: "Benzin", vites: "Otomatik", motor: "3.0" },
                    { ad: "3.0 TDI", yakit: "Dizel", vites: "Otomatik", motor: "3.0" },
                    { ad: "55 TFSI e-tron", yakit: "Hibrit", vites: "Otomatik", motor: "3.0" },
                ]},
            { ad: "e-tron", tip: "SUV", versiyonlar: [
                    { ad: "55 quattro", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "50 quattro", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "GT quattro", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                ]},
        ]
    },
    {
        marka: "BMW",
        modeller: [
            { ad: "1 Serisi", tip: "Otomobil", versiyonlar: [
                    { ad: "116i", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "118i", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "118d", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "120d", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "M135i", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                ]},
            { ad: "3 Serisi", tip: "Otomobil", versiyonlar: [
                    { ad: "318i", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "320i", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                    { ad: "320d", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "330i", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                    { ad: "330d", yakit: "Dizel", vites: "Otomatik", motor: "3.0" },
                    { ad: "330e", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                    { ad: "M340i", yakit: "Benzin", vites: "Otomatik", motor: "3.0" },
                    { ad: "M3", yakit: "Benzin", vites: "Manuel", motor: "3.0" },
                ]},
            { ad: "5 Serisi", tip: "Otomobil", versiyonlar: [
                    { ad: "520i", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                    { ad: "520d", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "530i", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                    { ad: "530d", yakit: "Dizel", vites: "Otomatik", motor: "3.0" },
                    { ad: "530e", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                    { ad: "540i", yakit: "Benzin", vites: "Otomatik", motor: "3.0" },
                    { ad: "M550i", yakit: "Benzin", vites: "Otomatik", motor: "4.4" },
                ]},
            { ad: "X1", tip: "SUV", versiyonlar: [
                    { ad: "sDrive18i", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "sDrive18d", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "xDrive20d", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "xDrive25e", yakit: "Hibrit", vites: "Otomatik", motor: "1.5" },
                ]},
            { ad: "X3", tip: "SUV", versiyonlar: [
                    { ad: "xDrive20i", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                    { ad: "xDrive20d", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "xDrive30i", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                    { ad: "xDrive30d", yakit: "Dizel", vites: "Otomatik", motor: "3.0" },
                    { ad: "xDrive30e", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                    { ad: "M40i", yakit: "Benzin", vites: "Otomatik", motor: "3.0" },
                ]},
            { ad: "X5", tip: "SUV", versiyonlar: [
                    { ad: "xDrive40i", yakit: "Benzin", vites: "Otomatik", motor: "3.0" },
                    { ad: "xDrive30d", yakit: "Dizel", vites: "Otomatik", motor: "3.0" },
                    { ad: "xDrive45e", yakit: "Hibrit", vites: "Otomatik", motor: "3.0" },
                    { ad: "M50i", yakit: "Benzin", vites: "Otomatik", motor: "4.4" },
                ]},
        ]
    },
    {
        marka: "Dacia",
        modeller: [
            { ad: "Duster", tip: "SUV", versiyonlar: [
                    { ad: "1.0 TCe ECO-G 100 Essential", yakit: "LPG", vites: "Manuel", motor: "1.0" },
                    { ad: "1.0 TCe 90 Essential", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.0 TCe 90 Comfort", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.5 Blue dCi 115 Comfort", yakit: "Dizel", vites: "Manuel", motor: "1.5" },
                    { ad: "1.5 Blue dCi 115 Prestige", yakit: "Dizel", vites: "Otomatik", motor: "1.5" },
                    { ad: "1.3 TCe 130 Extreme", yakit: "Benzin", vites: "Otomatik", motor: "1.3" },
                ]},
            { ad: "Sandero", tip: "Otomobil", versiyonlar: [
                    { ad: "1.0 SCe Essential", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.0 TCe 90 Essential", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.0 TCe ECO-G 100 Comfort", yakit: "LPG", vites: "Manuel", motor: "1.0" },
                    { ad: "1.0 TCe 90 Stepway", yakit: "Benzin", vites: "Otomatik", motor: "1.0" },
                ]},
            { ad: "Logan", tip: "Otomobil", versiyonlar: [
                    { ad: "1.0 SCe 65 Essential", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.0 TCe 100 Comfort", yakit: "Benzin", vites: "Otomatik", motor: "1.0" },
                    { ad: "1.5 Blue dCi 95 Comfort", yakit: "Dizel", vites: "Manuel", motor: "1.5" },
                ]},
            { ad: "Spring", tip: "Otomobil", versiyonlar: [
                    { ad: "Essential", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "Comfort", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "Extreme", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                ]},
            { ad: "Jogger", tip: "SUV", versiyonlar: [
                    { ad: "1.0 TCe 110 Essential", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.0 TCe ECO-G 100 Comfort", yakit: "LPG", vites: "Manuel", motor: "1.0" },
                    { ad: "Hybrid 140 Extreme", yakit: "Hibrit", vites: "Otomatik", motor: "1.6" },
                ]},
        ]
    },
    {
        marka: "Fiat",
        modeller: [
            { ad: "Egea", tip: "Otomobil", versiyonlar: [
                    { ad: "1.4 Fire Easy", yakit: "Benzin", vites: "Manuel", motor: "1.4" },
                    { ad: "1.4 Fire Urban", yakit: "Benzin", vites: "Manuel", motor: "1.4" },
                    { ad: "1.6 Multijet Easy", yakit: "Dizel", vites: "Manuel", motor: "1.6" },
                    { ad: "1.6 Multijet Urban", yakit: "Dizel", vites: "Manuel", motor: "1.6" },
                    { ad: "1.6 Multijet Lounge", yakit: "Dizel", vites: "Otomatik", motor: "1.6" },
                    { ad: "1.0 Hybrid Easy", yakit: "Hibrit", vites: "Manuel", motor: "1.0" },
                    { ad: "1.0 Hybrid Cross", yakit: "Hibrit", vites: "Manuel", motor: "1.0" },
                ]},
            { ad: "500", tip: "Otomobil", versiyonlar: [
                    { ad: "1.0 Hybrid Dolcevita", yakit: "Hibrit", vites: "Manuel", motor: "1.0" },
                    { ad: "1.0 Hybrid Star", yakit: "Hibrit", vites: "Otomatik", motor: "1.0" },
                    { ad: "e Icon", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "e Action", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "e La Prima", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                ]},
            { ad: "Doblo", tip: "Ticari", versiyonlar: [
                    { ad: "1.6 Multijet Combi", yakit: "Dizel", vites: "Manuel", motor: "1.6" },
                    { ad: "1.6 Multijet Dynamic", yakit: "Dizel", vites: "Manuel", motor: "1.6" },
                    { ad: "1.3 Multijet Pop", yakit: "Dizel", vites: "Manuel", motor: "1.3" },
                ]},
        ]
    },
    {
        marka: "Ford",
        modeller: [
            { ad: "Fiesta", tip: "Otomobil", versiyonlar: [
                    { ad: "1.1 Ti-VCT Trend", yakit: "Benzin", vites: "Manuel", motor: "1.1" },
                    { ad: "1.1 Ti-VCT Titanium", yakit: "Benzin", vites: "Otomatik", motor: "1.1" },
                    { ad: "1.0 EcoBoost ST-Line", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.5 TDCi Trend", yakit: "Dizel", vites: "Manuel", motor: "1.5" },
                ]},
            { ad: "Focus", tip: "Otomobil", versiyonlar: [
                    { ad: "1.0 EcoBoost Trend", yakit: "Benzin", vites: "Otomatik", motor: "1.0" },
                    { ad: "1.0 EcoBoost Titanium", yakit: "Benzin", vites: "Otomatik", motor: "1.0" },
                    { ad: "1.5 EcoBoost ST-Line", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "1.5 EcoBlue Trend", yakit: "Dizel", vites: "Manuel", motor: "1.5" },
                    { ad: "1.5 EcoBlue ST-Line", yakit: "Dizel", vites: "Otomatik", motor: "1.5" },
                    { ad: "2.3 EcoBoost ST", yakit: "Benzin", vites: "Manuel", motor: "2.3" },
                ]},
            { ad: "Kuga", tip: "SUV", versiyonlar: [
                    { ad: "1.5 EcoBoost Trend", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "1.5 EcoBoost Titanium", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "2.0 EcoBlue Titanium", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "2.5 PHEV ST-Line", yakit: "Hibrit", vites: "Otomatik", motor: "2.5" },
                    { ad: "2.5 PHEV Titanium X", yakit: "Hibrit", vites: "Otomatik", motor: "2.5" },
                ]},
            { ad: "Puma", tip: "SUV", versiyonlar: [
                    { ad: "1.0 EcoBoost Trend", yakit: "Benzin", vites: "Otomatik", motor: "1.0" },
                    { ad: "1.0 EcoBoost mHEV Titanium", yakit: "Hibrit", vites: "Otomatik", motor: "1.0" },
                    { ad: "1.0 EcoBoost ST-Line", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.5 EcoBlue Titanium", yakit: "Dizel", vites: "Manuel", motor: "1.5" },
                ]},
            { ad: "Ranger", tip: "Pickup", versiyonlar: [
                    { ad: "2.0 TDCi XL", yakit: "Dizel", vites: "Manuel", motor: "2.0" },
                    { ad: "2.0 TDCi XLT", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "2.0 TDCi Wildtrak", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "3.0 TDCi Raptor", yakit: "Dizel", vites: "Otomatik", motor: "3.0" },
                ]},
        ]
    },
    {
        marka: "Honda",
        modeller: [
            { ad: "Civic", tip: "Otomobil", versiyonlar: [
                    { ad: "1.5 VTEC Elegance", yakit: "Benzin", vites: "Manuel", motor: "1.5" },
                    { ad: "1.5 VTEC Executive", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "1.5 VTEC Executive Plus", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "e:HEV Elegance", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                    { ad: "e:HEV Executive", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                    { ad: "Type R", yakit: "Benzin", vites: "Manuel", motor: "2.0" },
                ]},
            { ad: "HR-V", tip: "SUV", versiyonlar: [
                    { ad: "e:HEV Elegance", yakit: "Hibrit", vites: "Otomatik", motor: "1.5" },
                    { ad: "e:HEV Executive", yakit: "Hibrit", vites: "Otomatik", motor: "1.5" },
                ]},
            { ad: "CR-V", tip: "SUV", versiyonlar: [
                    { ad: "1.5 VTEC Executive", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "2.0 e:HEV Elegance", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                    { ad: "2.0 e:HEV Executive", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                    { ad: "e:PHEV Advance", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                ]},
        ]
    },
    {
        marka: "Hyundai",
        modeller: [
            { ad: "i10", tip: "Otomobil", versiyonlar: [
                    { ad: "1.0 MPi Comfort", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.0 MPi Elite", yakit: "Benzin", vites: "Otomatik", motor: "1.0" },
                    { ad: "1.0 T-GDi N Line", yakit: "Benzin", vites: "Otomatik", motor: "1.0" },
                ]},
            { ad: "i20", tip: "Otomobil", versiyonlar: [
                    { ad: "1.0 T-GDi Comfort", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.0 T-GDi Elite", yakit: "Benzin", vites: "Otomatik", motor: "1.0" },
                    { ad: "1.0 T-GDi N Line", yakit: "Benzin", vites: "Otomatik", motor: "1.0" },
                    { ad: "1.4 MPi Comfort", yakit: "Benzin", vites: "Otomatik", motor: "1.4" },
                ]},
            { ad: "i30", tip: "Otomobil", versiyonlar: [
                    { ad: "1.0 T-GDi Comfort", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.5 DPi Comfort", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "1.6 CRDi Comfort", yakit: "Dizel", vites: "Manuel", motor: "1.6" },
                    { ad: "1.6 CRDi Elite", yakit: "Dizel", vites: "Otomatik", motor: "1.6" },
                    { ad: "2.0 T-GDi N", yakit: "Benzin", vites: "Manuel", motor: "2.0" },
                ]},
            { ad: "Tucson", tip: "SUV", versiyonlar: [
                    { ad: "1.6 T-GDi Comfort", yakit: "Benzin", vites: "Otomatik", motor: "1.6" },
                    { ad: "1.6 T-GDi Elite", yakit: "Benzin", vites: "Otomatik", motor: "1.6" },
                    { ad: "1.6 CRDi Comfort", yakit: "Dizel", vites: "Otomatik", motor: "1.6" },
                    { ad: "1.6 CRDi Elite", yakit: "Dizel", vites: "Otomatik", motor: "1.6" },
                    { ad: "1.6 T-GDi HEV Comfort", yakit: "Hibrit", vites: "Otomatik", motor: "1.6" },
                    { ad: "1.6 T-GDi PHEV Elite", yakit: "Hibrit", vites: "Otomatik", motor: "1.6" },
                ]},
            { ad: "Santa Fe", tip: "SUV", versiyonlar: [
                    { ad: "2.0 CRDi Comfort", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "2.0 CRDi Elite", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "1.6 T-GDi HEV Comfort", yakit: "Hibrit", vites: "Otomatik", motor: "1.6" },
                    { ad: "1.6 T-GDi PHEV Elite", yakit: "Hibrit", vites: "Otomatik", motor: "1.6" },
                ]},
            { ad: "IONIQ 5", tip: "SUV", versiyonlar: [
                    { ad: "Standard Range RWD", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "Long Range RWD", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "Long Range AWD", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                ]},
            { ad: "IONIQ 6", tip: "Otomobil", versiyonlar: [
                    { ad: "Standard Range RWD", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "Long Range RWD", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "Long Range AWD", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                ]},
        ]
    },
    {
        marka: "Kia",
        modeller: [
            { ad: "Picanto", tip: "Otomobil", versiyonlar: [
                    { ad: "1.0 MPI Comfort", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.0 T-GDi Premium", yakit: "Benzin", vites: "Otomatik", motor: "1.0" },
                    { ad: "1.2 MPI Comfort", yakit: "Benzin", vites: "Manuel", motor: "1.2" },
                ]},
            { ad: "Ceed", tip: "Otomobil", versiyonlar: [
                    { ad: "1.0 T-GDi Comfort", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.5 T-GDi GT Line", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "1.6 CRDi Comfort", yakit: "Dizel", vites: "Manuel", motor: "1.6" },
                    { ad: "1.6 CRDi GT Line", yakit: "Dizel", vites: "Otomatik", motor: "1.6" },
                ]},
            { ad: "Sportage", tip: "SUV", versiyonlar: [
                    { ad: "1.6 T-GDi Comfort", yakit: "Benzin", vites: "Otomatik", motor: "1.6" },
                    { ad: "1.6 T-GDi GT Line", yakit: "Benzin", vites: "Otomatik", motor: "1.6" },
                    { ad: "1.6 CRDi Comfort", yakit: "Dizel", vites: "Otomatik", motor: "1.6" },
                    { ad: "1.6 T-GDi HEV Comfort", yakit: "Hibrit", vites: "Otomatik", motor: "1.6" },
                    { ad: "1.6 T-GDi PHEV GT Line", yakit: "Hibrit", vites: "Otomatik", motor: "1.6" },
                ]},
            { ad: "Sorento", tip: "SUV", versiyonlar: [
                    { ad: "2.2 CRDi Comfort", yakit: "Dizel", vites: "Otomatik", motor: "2.2" },
                    { ad: "1.6 T-GDi HEV GT Line", yakit: "Hibrit", vites: "Otomatik", motor: "1.6" },
                    { ad: "1.6 T-GDi PHEV GT Line Premium", yakit: "Hibrit", vites: "Otomatik", motor: "1.6" },
                ]},
            { ad: "EV6", tip: "SUV", versiyonlar: [
                    { ad: "Standard Range RWD", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "Long Range RWD", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "Long Range AWD GT Line", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "GT", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                ]},
        ]
    },
    {
        marka: "Mercedes-Benz",
        modeller: [
            { ad: "A Serisi", tip: "Otomobil", versiyonlar: [
                    { ad: "A 180 Progressive", yakit: "Benzin", vites: "Otomatik", motor: "1.3" },
                    { ad: "A 200 Progressive", yakit: "Benzin", vites: "Otomatik", motor: "1.3" },
                    { ad: "A 180 d Progressive", yakit: "Dizel", vites: "Otomatik", motor: "1.5" },
                    { ad: "A 220 d AMG Line", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "A 250 e AMG Line", yakit: "Hibrit", vites: "Otomatik", motor: "1.3" },
                ]},
            { ad: "C Serisi", tip: "Otomobil", versiyonlar: [
                    { ad: "C 180 Progressive", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "C 200 Progressive", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "C 220 d Progressive", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "C 300 AMG Line", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                    { ad: "C 300 e AMG Line", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                    { ad: "C 300 de AMG Line", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                ]},
            { ad: "E Serisi", tip: "Otomobil", versiyonlar: [
                    { ad: "E 200 Progressive", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "E 220 d Progressive", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "E 300 AMG Line", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                    { ad: "E 300 de AMG Line", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                    { ad: "E 450 4MATIC AMG Line", yakit: "Benzin", vites: "Otomatik", motor: "3.0" },
                ]},
            { ad: "GLC", tip: "SUV", versiyonlar: [
                    { ad: "GLC 200 Progressive", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "GLC 220 d 4MATIC", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "GLC 300 4MATIC AMG Line", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                    { ad: "GLC 300 e 4MATIC", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                    { ad: "AMG GLC 43 4MATIC", yakit: "Benzin", vites: "Otomatik", motor: "3.0" },
                ]},
            { ad: "GLE", tip: "SUV", versiyonlar: [
                    { ad: "GLE 300 d 4MATIC", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "GLE 350 de 4MATIC", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                    { ad: "GLE 400 d 4MATIC", yakit: "Dizel", vites: "Otomatik", motor: "3.0" },
                    { ad: "AMG GLE 53 4MATIC+", yakit: "Benzin", vites: "Otomatik", motor: "3.0" },
                ]},
            { ad: "EQA", tip: "SUV", versiyonlar: [
                    { ad: "EQA 250", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "EQA 250+", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "EQA 300 4MATIC", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                ]},
        ]
    },
    {
        marka: "Opel",
        modeller: [
            { ad: "Corsa", tip: "Otomobil", versiyonlar: [
                    { ad: "1.2 Edition", yakit: "Benzin", vites: "Manuel", motor: "1.2" },
                    { ad: "1.2 T Elegance", yakit: "Benzin", vites: "Otomatik", motor: "1.2" },
                    { ad: "1.2 T GS Line", yakit: "Benzin", vites: "Otomatik", motor: "1.2" },
                    { ad: "1.5 D Edition", yakit: "Dizel", vites: "Manuel", motor: "1.5" },
                    { ad: "Corsa-e Edition", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "Corsa-e Elegance", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                ]},
            { ad: "Astra", tip: "Otomobil", versiyonlar: [
                    { ad: "1.2 T Edition", yakit: "Benzin", vites: "Manuel", motor: "1.2" },
                    { ad: "1.2 T Elegance", yakit: "Benzin", vites: "Otomatik", motor: "1.2" },
                    { ad: "1.2 T GS Line", yakit: "Benzin", vites: "Otomatik", motor: "1.2" },
                    { ad: "1.5 D Elegance", yakit: "Dizel", vites: "Otomatik", motor: "1.5" },
                    { ad: "1.6 PHEV GS Line", yakit: "Hibrit", vites: "Otomatik", motor: "1.6" },
                    { ad: "Astra-e Elegance", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                ]},
            { ad: "Mokka", tip: "SUV", versiyonlar: [
                    { ad: "1.2 T Edition", yakit: "Benzin", vites: "Manuel", motor: "1.2" },
                    { ad: "1.2 T Elegance", yakit: "Benzin", vites: "Otomatik", motor: "1.2" },
                    { ad: "1.2 T GS Line", yakit: "Benzin", vites: "Otomatik", motor: "1.2" },
                    { ad: "Mokka-e Elegance", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "Mokka-e GS Line", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                ]},
            { ad: "Grandland", tip: "SUV", versiyonlar: [
                    { ad: "1.2 T GS Line", yakit: "Benzin", vites: "Otomatik", motor: "1.2" },
                    { ad: "1.5 D Elegance", yakit: "Dizel", vites: "Otomatik", motor: "1.5" },
                    { ad: "1.6 PHEV 4x4 GS Line", yakit: "Hibrit", vites: "Otomatik", motor: "1.6" },
                ]},
        ]
    },
    {
        marka: "Peugeot",
        modeller: [
            { ad: "208", tip: "Otomobil", versiyonlar: [
                    { ad: "1.2 PureTech Active", yakit: "Benzin", vites: "Manuel", motor: "1.2" },
                    { ad: "1.2 PureTech Allure", yakit: "Benzin", vites: "Otomatik", motor: "1.2" },
                    { ad: "1.2 PureTech GT", yakit: "Benzin", vites: "Otomatik", motor: "1.2" },
                    { ad: "1.5 BlueHDi Active", yakit: "Dizel", vites: "Manuel", motor: "1.5" },
                    { ad: "e-208 Active", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "e-208 Allure", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "e-208 GT", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                ]},
            { ad: "308", tip: "Otomobil", versiyonlar: [
                    { ad: "1.2 PureTech Active", yakit: "Benzin", vites: "Otomatik", motor: "1.2" },
                    { ad: "1.2 PureTech Allure", yakit: "Benzin", vites: "Otomatik", motor: "1.2" },
                    { ad: "1.5 BlueHDi Allure", yakit: "Dizel", vites: "Otomatik", motor: "1.5" },
                    { ad: "1.6 PHEV 225 GT", yakit: "Hibrit", vites: "Otomatik", motor: "1.6" },
                    { ad: "e-308 Allure", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "e-308 GT", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                ]},
            { ad: "2008", tip: "SUV", versiyonlar: [
                    { ad: "1.2 PureTech Active", yakit: "Benzin", vites: "Manuel", motor: "1.2" },
                    { ad: "1.2 PureTech Allure", yakit: "Benzin", vites: "Otomatik", motor: "1.2" },
                    { ad: "1.5 BlueHDi Allure", yakit: "Dizel", vites: "Otomatik", motor: "1.5" },
                    { ad: "e-2008 Active", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "e-2008 GT", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                ]},
            { ad: "3008", tip: "SUV", versiyonlar: [
                    { ad: "1.2 PureTech Allure", yakit: "Benzin", vites: "Otomatik", motor: "1.2" },
                    { ad: "1.5 BlueHDi Allure", yakit: "Dizel", vites: "Otomatik", motor: "1.5" },
                    { ad: "1.6 HYbrid 225 GT", yakit: "Hibrit", vites: "Otomatik", motor: "1.6" },
                    { ad: "e-3008 Allure", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "e-3008 GT", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                ]},
        ]
    },
    {
        marka: "Renault",
        modeller: [
            { ad: "Clio", tip: "Otomobil", versiyonlar: [
                    { ad: "1.0 TCe 90 Joy", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.0 TCe 90 Zen", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.0 TCe 90 Intens", yakit: "Benzin", vites: "Otomatik", motor: "1.0" },
                    { ad: "1.0 TCe 100 ECO-G Zen", yakit: "LPG", vites: "Manuel", motor: "1.0" },
                    { ad: "E-Tech 145 Full Hybrid", yakit: "Hibrit", vites: "Otomatik", motor: "1.6" },
                    { ad: "E-Tech 140 Engineered", yakit: "Hibrit", vites: "Otomatik", motor: "1.6" },
                ]},
            { ad: "Megane", tip: "Otomobil", versiyonlar: [
                    { ad: "1.3 TCe 115 Joy", yakit: "Benzin", vites: "Manuel", motor: "1.3" },
                    { ad: "1.3 TCe 140 Zen", yakit: "Benzin", vites: "Otomatik", motor: "1.3" },
                    { ad: "1.3 TCe 140 Intens", yakit: "Benzin", vites: "Otomatik", motor: "1.3" },
                    { ad: "1.5 Blue dCi 115 Zen", yakit: "Dizel", vites: "Manuel", motor: "1.5" },
                    { ad: "1.5 Blue dCi 115 Intens", yakit: "Dizel", vites: "Otomatik", motor: "1.5" },
                    { ad: "E-Tech 160 Engineered", yakit: "Hibrit", vites: "Otomatik", motor: "1.6" },
                ]},
            { ad: "Captur", tip: "SUV", versiyonlar: [
                    { ad: "1.0 TCe 90 Joy", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.0 TCe 90 Zen", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.3 TCe 140 Intens", yakit: "Benzin", vites: "Otomatik", motor: "1.3" },
                    { ad: "E-Tech 145 Full Hybrid Zen", yakit: "Hibrit", vites: "Otomatik", motor: "1.6" },
                    { ad: "E-Tech 160 PHEV Engineered", yakit: "Hibrit", vites: "Otomatik", motor: "1.6" },
                ]},
            { ad: "Kadjar", tip: "SUV", versiyonlar: [
                    { ad: "1.3 TCe 140 Zen", yakit: "Benzin", vites: "Otomatik", motor: "1.3" },
                    { ad: "1.3 TCe 160 Intens", yakit: "Benzin", vites: "Otomatik", motor: "1.3" },
                    { ad: "1.5 dCi 115 Zen", yakit: "Dizel", vites: "Manuel", motor: "1.5" },
                    { ad: "Blue dCi 115 Intens", yakit: "Dizel", vites: "Otomatik", motor: "1.5" },
                ]},
            { ad: "Arkana", tip: "SUV", versiyonlar: [
                    { ad: "1.3 TCe 140 Zen", yakit: "Benzin", vites: "Otomatik", motor: "1.3" },
                    { ad: "E-Tech 145 Full Hybrid Zen", yakit: "Hibrit", vites: "Otomatik", motor: "1.6" },
                    { ad: "E-Tech 145 Intens", yakit: "Hibrit", vites: "Otomatik", motor: "1.6" },
                    { ad: "E-Tech 145 Engineered", yakit: "Hibrit", vites: "Otomatik", motor: "1.6" },
                ]},
        ]
    },
    {
        marka: "Skoda",
        modeller: [
            { ad: "Fabia", tip: "Otomobil", versiyonlar: [
                    { ad: "1.0 MPI 65 Active", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.0 TSI 95 Ambition", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.0 TSI 110 Style", yakit: "Benzin", vites: "Otomatik", motor: "1.0" },
                    { ad: "1.5 TSI 150 Monte Carlo", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                ]},
            { ad: "Octavia", tip: "Otomobil", versiyonlar: [
                    { ad: "1.0 TSI 110 Active", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.5 TSI 150 Ambition", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "1.5 TSI 150 Style", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "2.0 TDI 150 Ambition", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "1.4 TSI iV 245 Style", yakit: "Hibrit", vites: "Otomatik", motor: "1.4" },
                    { ad: "2.0 TSI 245 RS", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                ]},
            { ad: "Karoq", tip: "SUV", versiyonlar: [
                    { ad: "1.0 TSI 115 Active", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.5 TSI 150 Style", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "2.0 TDI 150 Ambition", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                ]},
            { ad: "Kodiaq", tip: "SUV", versiyonlar: [
                    { ad: "1.5 TSI 150 Ambition", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "2.0 TDI 150 Style", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "2.0 TDI 200 Sportline", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "1.5 TSI iV 204 Style", yakit: "Hibrit", vites: "Otomatik", motor: "1.5" },
                ]},
        ]
    },
    {
        marka: "Toyota",
        modeller: [
            { ad: "Yaris", tip: "Otomobil", versiyonlar: [
                    { ad: "1.5 HSD Dream", yakit: "Hibrit", vites: "Otomatik", motor: "1.5" },
                    { ad: "1.5 HSD Flame", yakit: "Hibrit", vites: "Otomatik", motor: "1.5" },
                    { ad: "1.5 HSD GR Sport", yakit: "Hibrit", vites: "Otomatik", motor: "1.5" },
                    { ad: "GR Yaris", yakit: "Benzin", vites: "Manuel", motor: "1.6" },
                ]},
            { ad: "Corolla", tip: "Otomobil", versiyonlar: [
                    { ad: "1.8 HSD Dream", yakit: "Hibrit", vites: "Otomatik", motor: "1.8" },
                    { ad: "1.8 HSD Flame", yakit: "Hibrit", vites: "Otomatik", motor: "1.8" },
                    { ad: "1.8 HSD Passion", yakit: "Hibrit", vites: "Otomatik", motor: "1.8" },
                    { ad: "2.0 HSD Dream", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                    { ad: "2.0 HSD Flame", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                    { ad: "2.0 HSD Passion", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                    { ad: "GR Sport HSD", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                ]},
            { ad: "C-HR", tip: "SUV", versiyonlar: [
                    { ad: "1.8 HSD Dream", yakit: "Hibrit", vites: "Otomatik", motor: "1.8" },
                    { ad: "1.8 HSD Flame", yakit: "Hibrit", vites: "Otomatik", motor: "1.8" },
                    { ad: "2.0 HSD GR Sport", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                    { ad: "PHEV GR Sport", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                ]},
            { ad: "RAV4", tip: "SUV", versiyonlar: [
                    { ad: "2.0 Flame", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                    { ad: "2.5 HSD Dream 4x2", yakit: "Hibrit", vites: "Otomatik", motor: "2.5" },
                    { ad: "2.5 HSD Flame 4x2", yakit: "Hibrit", vites: "Otomatik", motor: "2.5" },
                    { ad: "2.5 HSD Passion 4x4", yakit: "Hibrit", vites: "Otomatik", motor: "2.5" },
                    { ad: "2.5 PHEV Executive 4x4", yakit: "Hibrit", vites: "Otomatik", motor: "2.5" },
                ]},
            { ad: "Hilux", tip: "Pickup", versiyonlar: [
                    { ad: "2.4 D-4D 4x2 Comfort", yakit: "Dizel", vites: "Manuel", motor: "2.4" },
                    { ad: "2.4 D-4D 4x2 Adventure", yakit: "Dizel", vites: "Otomatik", motor: "2.4" },
                    { ad: "2.8 D-4D 4x4 Comfort", yakit: "Dizel", vites: "Manuel", motor: "2.8" },
                    { ad: "2.8 D-4D 4x4 Adventure", yakit: "Dizel", vites: "Otomatik", motor: "2.8" },
                    { ad: "2.8 D-4D GR Sport", yakit: "Dizel", vites: "Otomatik", motor: "2.8" },
                ]},
            { ad: "bZ4X", tip: "SUV", versiyonlar: [
                    { ad: "FWD Dream", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "FWD Passion", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "AWD Passion", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                ]},
        ]
    },
    {
        marka: "Volkswagen",
        modeller: [
            { ad: "Polo", tip: "Otomobil", versiyonlar: [
                    { ad: "1.0 TSI 95 Impression", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.0 TSI 95 Comfortline", yakit: "Benzin", vites: "Otomatik", motor: "1.0" },
                    { ad: "1.0 TSI 110 Highline", yakit: "Benzin", vites: "Otomatik", motor: "1.0" },
                    { ad: "1.0 TSI 110 GTI Line", yakit: "Benzin", vites: "Otomatik", motor: "1.0" },
                    { ad: "2.0 TSI 207 GTI", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                ]},
            { ad: "Golf", tip: "Otomobil", versiyonlar: [
                    { ad: "1.0 TSI 110 Life", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.0 eTSI 110 Life", yakit: "Hibrit", vites: "Otomatik", motor: "1.0" },
                    { ad: "1.5 TSI 130 Life", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "1.5 eTSI 150 Style", yakit: "Hibrit", vites: "Otomatik", motor: "1.5" },
                    { ad: "2.0 TDI 116 Life", yakit: "Dizel", vites: "Manuel", motor: "2.0" },
                    { ad: "2.0 TDI 150 Style", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "1.4 eHybrid 245 GTE", yakit: "Hibrit", vites: "Otomatik", motor: "1.4" },
                    { ad: "2.0 TSI 245 GTI", yakit: "Benzin", vites: "Manuel", motor: "2.0" },
                    { ad: "2.0 TSI 320 R", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                ]},
            { ad: "Passat", tip: "Otomobil", versiyonlar: [
                    { ad: "1.5 TSI 150 Impression", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "2.0 TDI 150 Impression", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "2.0 TDI 200 Elegance", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "1.4 TSI eHybrid 218 GTE", yakit: "Hibrit", vites: "Otomatik", motor: "1.4" },
                    { ad: "2.0 TDI 150 Elegance", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                ]},
            { ad: "Tiguan", tip: "SUV", versiyonlar: [
                    { ad: "1.5 TSI 130 Life", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "1.5 TSI 150 Elegance", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "1.5 eTSI 150 Life", yakit: "Hibrit", vites: "Otomatik", motor: "1.5" },
                    { ad: "1.5 eTSI 150 Elegance", yakit: "Hibrit", vites: "Otomatik", motor: "1.5" },
                    { ad: "2.0 TDI 150 Life", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "2.0 TDI 200 Elegance", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "1.4 eHybrid 245 Elegance", yakit: "Hibrit", vites: "Otomatik", motor: "1.4" },
                    { ad: "2.0 TSI 320 R-Line 4Motion", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                ]},
            { ad: "T-Roc", tip: "SUV", versiyonlar: [
                    { ad: "1.0 TSI 110 Life", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.5 TSI 150 Style", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "2.0 TDI 150 Style", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "2.0 TSI 300 R", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                ]},
            { ad: "Touareg", tip: "SUV", versiyonlar: [
                    { ad: "3.0 TDI 231 Life", yakit: "Dizel", vites: "Otomatik", motor: "3.0" },
                    { ad: "3.0 TDI 286 Elegance", yakit: "Dizel", vites: "Otomatik", motor: "3.0" },
                    { ad: "3.0 TSI eHybrid 381 Elegance", yakit: "Hibrit", vites: "Otomatik", motor: "3.0" },
                    { ad: "3.0 TSI eHybrid 462 R-Line", yakit: "Hibrit", vites: "Otomatik", motor: "3.0" },
                ]},
            { ad: "Taigo", tip: "SUV", versiyonlar: [
                    { ad: "1.0 TSI 95 Life", yakit: "Benzin", vites: "Manuel", motor: "1.0" },
                    { ad: "1.0 TSI 110 Style", yakit: "Benzin", vites: "Otomatik", motor: "1.0" },
                    { ad: "1.5 TSI 150 R-Line", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                ]},
            { ad: "ID.4", tip: "SUV", versiyonlar: [
                    { ad: "Pure Performance", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "Pro Performance", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "Pro S", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "GTX 4Motion", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                ]},
        ]
    },
    {
        marka: "Volvo",
        modeller: [
            { ad: "XC40", tip: "SUV", versiyonlar: [
                    { ad: "B3 FWD Core", yakit: "Benzin", vites: "Otomatik", motor: "1.5" },
                    { ad: "B4 AWD Plus", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                    { ad: "D3 FWD Momentum", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "T5 Recharge AWD R-Design", yakit: "Hibrit", vites: "Otomatik", motor: "1.5" },
                    { ad: "Recharge Pure Electric Core", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                    { ad: "Recharge Pure Electric Plus", yakit: "Elektrik", vites: "Otomatik", motor: "-" },
                ]},
            { ad: "XC60", tip: "SUV", versiyonlar: [
                    { ad: "B4 FWD Core", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                    { ad: "B4 AWD Plus Dark", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                    { ad: "D4 AWD Momentum", yakit: "Dizel", vites: "Otomatik", motor: "2.0" },
                    { ad: "T6 Recharge AWD Plus", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                    { ad: "T8 Recharge AWD Ultimate", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                ]},
            { ad: "S60", tip: "Otomobil", versiyonlar: [
                    { ad: "B4 Core", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                    { ad: "B5 Plus Dark", yakit: "Benzin", vites: "Otomatik", motor: "2.0" },
                    { ad: "T8 Recharge AWD Ultra", yakit: "Hibrit", vites: "Otomatik", motor: "2.0" },
                ]},
        ]
    },
]

export default CAR_DATA