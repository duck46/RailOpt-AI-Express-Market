from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import httpx
import json
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="RailOpt AI Express Market API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store-and-forward queue
order_queue: list[dict] = []

RETAIL_ITEMS = [
    # ── Ontario Corridor ──────────────────────────────────────────────────────
    {
        "id": "KGN-001",
        "station": "Kingston",
        "province": "Ontario",
        "vendor": "Limestone City Craft Co.",
        "name": "Handmade Cozy Cabin Bear Socks",
        "price": 24.00,
        "price_display": "$24.00",
        "category": "Souvenirs",
        "description": "Hand-knitted artisan socks featuring Kingston's iconic Limestone heritage motifs.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "KGN-002",
        "station": "Kingston",
        "province": "Ontario",
        "vendor": "Kingston Heritage Press",
        "name": "Hand-Pressed Waterfront Postcards",
        "price": 12.50,
        "price_display": "$12.50",
        "category": "Souvenirs",
        "description": "Letterpress-printed postcards showcasing Kingston's historic waterfront and fort.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "CBG-001",
        "station": "Cobourg",
        "province": "Ontario",
        "vendor": "Last Mountain Farms",
        "name": "Old Fashioned Saskatoon Berry Jam",
        "price": 14.00,
        "price_display": "$14.00",
        "category": "Retail",
        "description": "Small-batch, no-preservative Saskatoon berry jam from the Northumberland Hills.",
        "in_stock": True,
        "perishable": False,
    },
    # ── British Columbia — Prince George ─────────────────────────────────────
    {
        "id": "PG-001",
        "station": "Prince George",
        "province": "British Columbia",
        "vendor": "Nechako River Trading Co.",
        "name": "Northern Rainforest Cedar Soap Bar",
        "price": 11.00,
        "price_display": "$11.00",
        "category": "Retail",
        "description": "Cold-pressed cedar and spruce soap hand-crafted in Prince George's boreal rainforest tradition.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "PG-002",
        "station": "Prince George",
        "province": "British Columbia",
        "vendor": "Central BC Railway Museum Shop",
        "name": "Heritage Railway Enamel Pin Set",
        "price": 18.00,
        "price_display": "$18.00",
        "category": "Souvenirs",
        "description": "Set of 3 enamel pins celebrating the locomotives that shaped Northern BC's forestry era.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "PG-003",
        "station": "Prince George",
        "province": "British Columbia",
        "vendor": "Teapot Mountain Provisions",
        "name": "Wild Boreal Mushroom Seasoning Blend",
        "price": 13.50,
        "price_display": "$13.50",
        "category": "Retail",
        "description": "Dried wild mushroom and herb seasoning foraged from the Nechako River valley woodlands.",
        "in_stock": True,
        "perishable": False,
    },
    # ── British Columbia — Prince Rupert ─────────────────────────────────────
    {
        "id": "PR-001",
        "station": "Prince Rupert",
        "province": "British Columbia",
        "vendor": "Cow Bay Collective",
        "name": "Ts'msyen Coastal Art Print",
        "price": 22.00,
        "price_display": "$22.00",
        "category": "Souvenirs",
        "description": "Archival giclée print by a local Ts'msyen artist celebrating the Pacific North Coast's indigenous heritage.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "PR-002",
        "station": "Prince Rupert",
        "province": "British Columbia",
        "vendor": "North Pacific Cannery Co-op",
        "name": "Pacific Coast Kelp & Sea Salt Flakes",
        "price": 9.50,
        "price_display": "$9.50",
        "category": "Retail",
        "description": "Hand-harvested bull kelp dried with Pacific sea salt from the Khutzeymateen shoreline.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "PR-003",
        "station": "Prince Rupert",
        "province": "British Columbia",
        "vendor": "Kaien Island Outfitters",
        "name": "Grizzly Sanctuary Trail Map Bandana",
        "price": 16.00,
        "price_display": "$16.00",
        "category": "Souvenirs",
        "description": "Cotton bandana printed with an illustrated map of the Khutzeymateen Grizzly Sanctuary trails.",
        "in_stock": True,
        "perishable": False,
    },
    # ── British Columbia — Kamloops ───────────────────────────────────────────
    {
        "id": "KAM-001",
        "station": "Kamloops",
        "province": "British Columbia",
        "vendor": "Thompson Rivers Craft Roasters",
        "name": "Interior BC Wildfire Roast Coffee",
        "price": 19.00,
        "price_display": "$19.00",
        "category": "Retail",
        "description": "Bold dark roast whole-bean coffee from a Kamloops micro-roaster, inspired by the sun-baked canyon landscape.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "KAM-002",
        "station": "Kamloops",
        "province": "British Columbia",
        "vendor": "Lac du Bois Artisans",
        "name": "Grasslands Beeswax Candle",
        "price": 17.50,
        "price_display": "$17.50",
        "category": "Retail",
        "description": "100% pure beeswax candle with a sage and pine scent profile, poured by Kamloops artisans.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "KAM-003",
        "station": "Kamloops",
        "province": "British Columbia",
        "vendor": "Kamloops Farmers' Market Collective",
        "name": "Sockeye Salmon Run Commemorative Pin",
        "price": 12.00,
        "price_display": "$12.00",
        "category": "Souvenirs",
        "description": "Limited edition enamel pin marking the Adams River Sockeye Salmon run — one of BC's greatest natural spectacles.",
        "in_stock": True,
        "perishable": False,
    },
    # ── Manitoba — Winnipeg ───────────────────────────────────────────────────
    {
        "id": "WPG-001",
        "station": "Winnipeg",
        "province": "Manitoba",
        "vendor": "Exchange District Collective",
        "name": "Winnipeg Street Mural Art Print",
        "price": 24.00,
        "price_display": "$24.00",
        "category": "Souvenirs",
        "description": "High-quality reproduction of one of Winnipeg's 600+ iconic outdoor murals, printed on archival matte paper.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "WPG-002",
        "station": "Winnipeg",
        "province": "Manitoba",
        "vendor": "Le Musée de Saint-Boniface Shop",
        "name": "Métis Heritage Woven Bookmark Set",
        "price": 14.00,
        "price_display": "$14.00",
        "category": "Souvenirs",
        "description": "Set of 3 hand-woven bookmarks inspired by traditional Métis finger-weaving patterns, made by Saint-Boniface artisans.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "WPG-003",
        "station": "Winnipeg",
        "province": "Manitoba",
        "vendor": "The Forks Market Artisans",
        "name": "Red River Prairie Wildflower Candle",
        "price": 20.00,
        "price_display": "$20.00",
        "category": "Retail",
        "description": "Soy wax candle blended with Manitoba prairie wildflower extracts — crocus, fleabane, and goldenrod — poured at The Forks.",
        "in_stock": True,
        "perishable": False,
    },
    # ── Manitoba — Thompson ───────────────────────────────────────────────────
    {
        "id": "THO-001",
        "station": "Thompson",
        "province": "Manitoba",
        "vendor": "Heritage North Museum Shop",
        "name": "Boreal Forest Wildlife Field Guide",
        "price": 16.00,
        "price_display": "$16.00",
        "category": "Retail",
        "description": "Illustrated guide to Thompson's boreal forest fauna — wolverine, woodland caribou, great grey owl, and more.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "THO-002",
        "station": "Thompson",
        "province": "Manitoba",
        "vendor": "Spirit Way Cultural Co-op",
        "name": "Spirit Way Trail Commemorative Pin",
        "price": 12.00,
        "price_display": "$12.00",
        "category": "Souvenirs",
        "description": "Enamel pin marking Thompson's Spirit Way — a 2 km cultural pathway with 15 points celebrating the city's heritage.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "THO-003",
        "station": "Thompson",
        "province": "Manitoba",
        "vendor": "Burntwood River Trading Post",
        "name": "Northern Manitoba Boreal Cedar Soap",
        "price": 11.00,
        "price_display": "$11.00",
        "category": "Retail",
        "description": "Cold-pressed cedar and birch bar soap hand-crafted in Thompson, scented with the boreal forest's signature black spruce.",
        "in_stock": True,
        "perishable": False,
    },
    # ── Manitoba — The Pas ────────────────────────────────────────────────────
    {
        "id": "PAS-001",
        "station": "The Pas",
        "province": "Manitoba",
        "vendor": "Opaskwayak Cree Nation Artisans",
        "name": "Cree Beadwork Keychain",
        "price": 18.00,
        "price_display": "$18.00",
        "category": "Souvenirs",
        "description": "Hand-beaded keychain in traditional Opaskwayak Cree floral patterns, made by community artisans in The Pas.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "PAS-002",
        "station": "The Pas",
        "province": "Manitoba",
        "vendor": "Northern Trappers' Festival Co-op",
        "name": "Northern Manitoba Trappers' Festival Pin",
        "price": 10.00,
        "price_display": "$10.00",
        "category": "Souvenirs",
        "description": "Collectible enamel pin from the annual Northern Manitoba Trappers' Festival — one of Canada's oldest winter carnivals.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "PAS-003",
        "station": "The Pas",
        "province": "Manitoba",
        "vendor": "Clearwater Lake Outfitters",
        "name": "Gateway North Wilderness Journal",
        "price": 17.00,
        "price_display": "$17.00",
        "category": "Retail",
        "description": "Durable softcover field journal illustrated with maps of Clearwater Lake Provincial Park and the surrounding boreal trails.",
        "in_stock": True,
        "perishable": False,
    },
    # ── Manitoba — Churchill ──────────────────────────────────────────────────
    {
        "id": "CHU-001",
        "station": "Churchill",
        "province": "Manitoba",
        "vendor": "Churchill Wildlife Gift Shop",
        "name": "Polar Bear Hudson Bay Enamel Pin",
        "price": 14.00,
        "price_display": "$14.00",
        "category": "Souvenirs",
        "description": "Limited-edition enamel pin of Churchill's famous polar bears — the self-proclaimed 'Polar Bear Capital of the World'.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "CHU-002",
        "station": "Churchill",
        "province": "Manitoba",
        "vendor": "Itsanitaq Museum Shop",
        "name": "Inuit Art Miniature Print Collection",
        "price": 26.00,
        "price_display": "$26.00",
        "category": "Souvenirs",
        "description": "Set of 4 archival prints reproducing contemporary Inuit carvings and artworks from the Itsanitaq Museum collection.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "CHU-003",
        "station": "Churchill",
        "province": "Manitoba",
        "vendor": "Aurora Watch Churchill",
        "name": "Northern Lights Aurora Sky Map",
        "price": 19.00,
        "price_display": "$19.00",
        "category": "Souvenirs",
        "description": "Glow-in-the-dark aurora borealis sky chart for Churchill's latitude — visible up to 300 nights per year from Hudson Bay.",
        "in_stock": True,
        "perishable": False,
    },
    # ── Alberta — Edmonton ────────────────────────────────────────────────────
    {
        "id": "EDM-001",
        "station": "Edmonton",
        "province": "Alberta",
        "vendor": "Ice District Artisans",
        "name": "Edmonton Oilers Heritage Enamel Pin",
        "price": 16.00,
        "price_display": "$16.00",
        "category": "Souvenirs",
        "description": "Limited-edition enamel pin celebrating Edmonton's beloved NHL franchise, made by local artisans.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "EDM-002",
        "station": "Edmonton",
        "province": "Alberta",
        "vendor": "River Valley Naturals",
        "name": "North Saskatchewan Wildflower Seed Kit",
        "price": 14.00,
        "price_display": "$14.00",
        "category": "Retail",
        "description": "Curated seed kit featuring native wildflowers from Edmonton's River Valley — North America's largest urban parkland.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "EDM-003",
        "station": "Edmonton",
        "province": "Alberta",
        "vendor": "Royal Alberta Museum Shop",
        "name": "Alberta Heritage Illustrated Field Notes",
        "price": 19.50,
        "price_display": "$19.50",
        "category": "Retail",
        "description": "Hardcover illustrated journal with maps and natural history sketches from Western Canada's largest museum collection.",
        "in_stock": True,
        "perishable": False,
    },
    # ── Alberta — Jasper ──────────────────────────────────────────────────────
    {
        "id": "JSP-001",
        "station": "Jasper",
        "province": "Alberta",
        "vendor": "Dark Sky Collective Jasper",
        "name": "Jasper Dark Sky Preserve Star Chart",
        "price": 22.00,
        "price_display": "$22.00",
        "category": "Souvenirs",
        "description": "Archival-quality star chart of the world's second-largest Dark Sky Preserve, printed on heavyweight matte paper.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "JSP-002",
        "station": "Jasper",
        "province": "Alberta",
        "vendor": "Athabasca Alpine Co.",
        "name": "Glacier Mineral Soaking Salts",
        "price": 18.00,
        "price_display": "$18.00",
        "category": "Retail",
        "description": "Mineral bath salts blended with glacial clay and alpine botanicals, inspired by the Athabasca Glacier's ancient waters.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "JSP-003",
        "station": "Jasper",
        "province": "Alberta",
        "vendor": "Jasper Brewing Company",
        "name": "Rocky Mountain Craft Brewing Journal",
        "price": 15.00,
        "price_display": "$15.00",
        "category": "Souvenirs",
        "description": "Branded craft brewing tasting journal from Jasper's beloved national-park microbrewery — log every pour on the rails.",
        "in_stock": True,
        "perishable": False,
    },
    # ── Alberta — Banff ───────────────────────────────────────────────────────
    {
        "id": "BNF-001",
        "station": "Banff",
        "province": "Alberta",
        "vendor": "Lake Louise Studio Arts",
        "name": "Lake Louise Turquoise Watercolour Print",
        "price": 28.00,
        "price_display": "$28.00",
        "category": "Souvenirs",
        "description": "Original watercolour study of Lake Louise's famous turquoise waters and Victoria Glacier, giclée-reproduced on archival paper.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "BNF-002",
        "station": "Banff",
        "province": "Alberta",
        "vendor": "Banff Upper Hot Springs Co.",
        "name": "Sulphur Mountain Alpine Bath Soak",
        "price": 21.00,
        "price_display": "$21.00",
        "category": "Retail",
        "description": "Luxurious bath soak inspired by Banff's iconic Upper Hot Springs, with natural sulphur minerals and wild spruce essential oil.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "BNF-003",
        "station": "Banff",
        "province": "Alberta",
        "vendor": "Banff National Park Heritage Press",
        "name": "Rocky Mountains Pocket Trail Guide",
        "price": 13.00,
        "price_display": "$13.00",
        "category": "Retail",
        "description": "Waterproof pocket guide to Banff National Park's 1,600 km of trails, from Tunnel Mountain to the Valley of the Ten Peaks.",
        "in_stock": True,
        "perishable": False,
    },
    # ── British Columbia — Vancouver ──────────────────────────────────────────
    {
        "id": "VAN-001",
        "station": "Vancouver",
        "province": "British Columbia",
        "vendor": "Granville Island Market Co.",
        "name": "Pacific Coast Wildflower Honey",
        "price": 16.00,
        "price_display": "$16.00",
        "category": "Retail",
        "description": "Raw, unfiltered wildflower honey sourced from apiaries along the BC Pacific Coast.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "VAN-002",
        "station": "Vancouver",
        "province": "British Columbia",
        "vendor": "Stanley Park Naturalist Society",
        "name": "Rainforest Trail Pocket Field Guide",
        "price": 14.00,
        "price_display": "$14.00",
        "category": "Retail",
        "description": "Compact illustrated field guide to Stanley Park's 1,000-acre temperate rainforest ecosystem.",
        "in_stock": True,
        "perishable": False,
    },
    {
        "id": "VAN-003",
        "station": "Vancouver",
        "province": "British Columbia",
        "vendor": "Chinatown Artisan Press",
        "name": "Vancouver Skyline Linocut Print",
        "price": 26.00,
        "price_display": "$26.00",
        "category": "Souvenirs",
        "description": "Hand-carved linocut print of Vancouver's skyline framed by the North Shore mountains, made in Chinatown.",
        "in_stock": True,
        "perishable": False,
    },
]

# ── Destination content ────────────────────────────────────────────────────────

DESTINATIONS = [
    {
        "id": "prince-george",
        "name": "Prince George",
        "province": "British Columbia",
        "tagline": "Northern BC's boreal hub",
        "emoji": "🌲",
        "hero_color": "#1a3a2a",
        "highlights": [
            "Prince George Astronomical Observatory — breathtaking celestial views",
            "Two Rivers Gallery — immerse yourself in Canadian art",
            "Central BC Railway & Forestry Museum — the industries that shaped the north",
            "Teapot Mountain — 360° view of surrounding forests and wetlands",
            "Cottonwood Island Nature Park — walk along the Nechako River shoreline",
        ],
        "vibe": ["🎨 Arts & Culture", "🥾 Hiking", "🌿 Nature", "🚂 Rail Heritage"],
        "popular_routes": ["Jasper → Prince George", "Prince George → Prince Rupert"],
    },
    {
        "id": "prince-rupert",
        "name": "Prince Rupert",
        "province": "British Columbia",
        "tagline": "Wild Pacific North Coast",
        "emoji": "🐻",
        "hero_color": "#0d2233",
        "highlights": [
            "Khutzeymateen Grizzly Sanctuary — watch brown bears in their natural habitat",
            "Museum of Northern BC — home of the Ts'msyen People's history",
            "North Pacific Cannery National Historic Site (May–Sep)",
            "Humpback whale watching tours from the harbour",
            "Mount Hayes — panoramic view of the Pacific Ocean and nearby islands",
        ],
        "vibe": ["🐋 Wildlife", "🏔️ Adventure", "🎣 Fishing", "🏛️ Indigenous Culture"],
        "popular_routes": ["Jasper → Prince Rupert"],
    },
    {
        "id": "kamloops",
        "name": "Kamloops",
        "province": "British Columbia",
        "tagline": "Sunny interior at the river junction",
        "emoji": "🚵",
        "hero_color": "#2d1f0a",
        "highlights": [
            "Kamloops Farmers' Markets — fresh local produce on Sat & Wed",
            "Kweseltken Artisan Market — traditional foods and handmade goods",
            "Kamloops Bike Ranch — world-class mountain biking trails",
            "Adams River Sockeye Salmon Run — waters turn red (late Sep–mid Oct)",
            "Tsútswecw Provincial Park — 26 km of trails",
        ],
        "vibe": ["🚵 Mountain Biking", "🎭 Arts", "🍺 Craft Beer", "🐟 Nature"],
        "popular_routes": ["Vancouver → Kamloops", "Edmonton → Kamloops", "Toronto → Kamloops"],
    },
    {
        "id": "vancouver",
        "name": "Vancouver",
        "province": "British Columbia",
        "tagline": "Pacific metropolis between ocean and mountains",
        "emoji": "🌊",
        "hero_color": "#0a1f2d",
        "highlights": [
            "Stanley Park — 1,000-acre rainforest with 10 km ocean seawall",
            "Granville Island Public Market — fresh local produce and artisan goods",
            "Museum of Anthropology — 50,000+ works from cultures worldwide",
            "Canada's largest Chinatown — Dr. Sun Yat-Sen Classical Chinese Garden",
            "Capilano Suspension Bridge and Grouse Mountain (North Vancouver)",
        ],
        "vibe": ["🏙️ Urban", "🌊 Ocean", "🎨 Culture", "🌿 Green Spaces"],
        "popular_routes": ["Toronto → Vancouver", "Edmonton → Vancouver", "Montréal → Vancouver"],
    },
    # Manitoba stations
    {
        "id": "winnipeg",
        "name": "Winnipeg",
        "province": "Manitoba",
        "tagline": "Where the prairies meet the arts",
        "emoji": "🎨",
        "hero_color": "#1a0a2e",
        "highlights": [
            "Canadian Museum for Human Rights — one of the world's most striking museum buildings",
            "Exchange District — 600+ outdoor murals, boutiques, galleries, and local restaurants",
            "The Forks National Historic Site — where the Red and Assiniboine Rivers meet",
            "Assiniboine Park Zoo — 150+ animal species in a year-round urban oasis",
            "Riel House NHS — home of Louis Riel, founding father of Manitoba",
        ],
        "vibe": ["🎨 Street Art", "🏛️ Museums", "🎭 Performing Arts", "🌿 River Parks"],
        "popular_routes": ["Toronto → Winnipeg", "Vancouver → Winnipeg", "Edmonton → Winnipeg"],
    },
    {
        "id": "thompson",
        "name": "Thompson",
        "province": "Manitoba",
        "tagline": "Northern Manitoba's boreal gateway",
        "emoji": "🌲",
        "hero_color": "#0d1f0d",
        "highlights": [
            "Spirit Way — 2 km cultural trail with 15 heritage points of interest",
            "Millennium Trail — 15 km loop through the surrounding boreal forest",
            "Heritage North Museum — fur trade artifacts, fossils, and boreal forest diorama",
            "Pisew Falls Provincial Park — hike to Manitoba's two highest waterfalls",
            "Mystery Mountain Winter Park — skiing and snowboarding in the boreal",
        ],
        "vibe": ["🥾 Hiking", "🎿 Winter Sports", "🦌 Wildlife", "🌲 Boreal Forest"],
        "popular_routes": ["Winnipeg → Churchill", "Churchill → Winnipeg"],
    },
    {
        "id": "the-pas",
        "name": "The Pas",
        "province": "Manitoba",
        "tagline": "Gateway to the North",
        "emoji": "🏕️",
        "hero_color": "#0f1a0a",
        "highlights": [
            "Clearwater Lake Provincial Park — white sand beaches and turquoise crystalline waters",
            "Opaskwayak Cree Nation — vibrant Indigenous community with crafts and cultural events",
            "Northern Manitoba Trappers' Festival — one of Canada's oldest winter carnivals",
            "Bill Bannock Ice Fishing Derby — a beloved northern tradition on frozen lakes",
            "Canoeing and fishing on surrounding boreal lakes and rivers",
        ],
        "vibe": ["🏕️ Camping", "🎣 Fishing", "🛶 Canoeing", "🏛️ Indigenous Culture"],
        "popular_routes": ["Winnipeg → Churchill", "Churchill → Winnipeg"],
    },
    {
        "id": "churchill",
        "name": "Churchill",
        "province": "Manitoba",
        "tagline": "Polar bear capital of the world",
        "emoji": "🐻‍❄️",
        "hero_color": "#0a1a2a",
        "highlights": [
            "Polar bear watching — the world's best, every fall on Hudson Bay",
            "Beluga whale watching — 4,000+ belugas enter the Churchill River Estuary each summer",
            "Northern Lights (Aurora Borealis) — visible up to 300 nights per year",
            "Itsanitaq Museum — millennium-old Inuit artifacts and contemporary carvings",
            "Prince of Wales Fort NHS — a 300-year-old Hudson Bay Company stone fort",
        ],
        "vibe": ["🐻‍❄️ Wildlife", "🌌 Northern Lights", "🛶 Eco-Tourism", "🏛️ Inuit Culture"],
        "popular_routes": ["Winnipeg → Churchill", "Churchill → Winnipeg"],
    },
    # Alberta stations
    {
        "id": "edmonton",
        "name": "Edmonton",
        "province": "Alberta",
        "tagline": "Festival capital of the north",
        "emoji": "🏙️",
        "hero_color": "#1a2535",
        "highlights": [
            "50+ annual festivals — from Freewill Shakespeare to Farmfair International in November",
            "Royal Alberta Museum — Western Canada's largest museum with 82,000 sq ft of exhibits",
            "Edmonton River Valley — North America's largest urban parkland, 150+ km of trails",
            "ICE District & Rogers Place — Oilers games, Grand Villa Casino, and vibrant nightlife",
            "Day trip to Elk Island National Park — Plains bison, moose, and 250+ bird species",
        ],
        "vibe": ["🎭 Festivals", "🏛️ Museums", "🌿 Parks", "🏒 Sports"],
        "popular_routes": ["Toronto → Edmonton", "Vancouver → Edmonton", "Montréal → Edmonton"],
    },
    {
        "id": "jasper",
        "name": "Jasper",
        "province": "Alberta",
        "tagline": "Dark skies and glacial wilderness",
        "emoji": "⭐",
        "hero_color": "#0d1a0d",
        "highlights": [
            "Jasper National Park — Canada's largest Rocky Mountain park, 1,200 km of hiking trails",
            "Columbia Icefield — ride an Ice Explorer onto the Athabasca Glacier",
            "World's 2nd largest Dark Sky Preserve — stargazing like nowhere else on Earth",
            "Jasper SkyTram — seven-minute ride to Whistler Mountain's 360° panorama",
            "Fairmont Jasper Park Lodge Golf Course — SCOREgolf's best public course in Canada",
        ],
        "vibe": ["⭐ Stargazing", "🧊 Glaciers", "🥾 Hiking", "🐻 Wildlife"],
        "popular_routes": ["Vancouver → Jasper", "Edmonton → Jasper", "Toronto → Jasper"],
    },
    {
        "id": "banff",
        "name": "Banff",
        "province": "Alberta",
        "tagline": "Rooftop of Canada in the Rockies",
        "emoji": "🏔️",
        "hero_color": "#0d1f2d",
        "highlights": [
            "Lake Louise — turquoise glacial lake beneath Victoria Glacier at 1,885 m elevation",
            "Banff Upper Hot Springs — soak in sulphurous mineral pools with mountain views",
            "Cave and Basin National Historic Site — birthplace of Canada's national parks system",
            "Moraine Lake & Valley of the Ten Peaks — one of the world's most photographed vistas",
            "Banff Mountain Film & Book Festival — world-class outdoor adventure storytelling",
        ],
        "vibe": ["🏔️ Mountains", "🛁 Hot Springs", "📸 Photography", "🎿 Skiing"],
        "popular_routes": ["Vancouver → Banff", "Edmonton → Banff", "Toronto → Banff"],
    },
    # Ontario stations
    {
        "id": "kingston",
        "name": "Kingston",
        "province": "Ontario",
        "tagline": "Limestone City on Lake Ontario",
        "emoji": "🏰",
        "hero_color": "#1a1a0d",
        "highlights": [
            "Fort Henry National Historic Site — Canada's greatest 19th-century fort",
            "Historic downtown waterfront — boutiques and independent restaurants",
            "Kingston Penitentiary tours — Canada's most notorious prison",
            "Thousand Islands boat cruises — world-famous archipelago",
            "Queen's University campus — stunning limestone architecture",
        ],
        "vibe": ["🏛️ History", "🛍️ Shopping", "⛵ Boating", "🍺 Local Eats"],
        "popular_routes": ["Toronto → Kingston", "Montréal → Kingston"],
    },
    {
        "id": "cobourg",
        "name": "Cobourg",
        "province": "Ontario",
        "tagline": "Northumberland's hidden gem",
        "emoji": "🌾",
        "hero_color": "#1a0f0a",
        "highlights": [
            "Cobourg Beach — one of Ontario's finest sandy beaches",
            "Victoria Hall — ornate 1860 courthouse and concert hall",
            "Northumberland Farmers' Market — local produce and artisan goods",
            "Ganaraska Forest — hiking and cross-country skiing",
            "Historic downtown — boutique shops and local restaurants",
        ],
        "vibe": ["🏖️ Beach", "🌿 Nature", "🛍️ Artisan", "🏛️ Heritage"],
        "popular_routes": ["Toronto → Cobourg", "Cobourg → Montréal"],
    },
]


# --- Offline Dashboard ---

@app.get("/api/offline-dashboard")
def get_offline_dashboard():
    stations = sorted(set(i["station"] for i in RETAIL_ITEMS))
    return {
        "status": "ok",
        "phase": "Phase 1 — Non-Perishable Local Regional Retail",
        "stations": stations,
        "items": RETAIL_ITEMS,
    }


# --- Destinations ---

@app.get("/api/destinations")
def get_destinations():
    return {"destinations": DESTINATIONS}


@app.get("/api/destinations/{destination_id}")
def get_destination(destination_id: str):
    dest = next((d for d in DESTINATIONS if d["id"] == destination_id), None)
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found")
    items = [i for i in RETAIL_ITEMS if i["station"].lower().replace(" ", "-") == destination_id]
    return {**dest, "items": items}


# --- Offline Order Queue ---

class OrderRequest(BaseModel):
    item_id: str
    quantity: int = 1
    passenger_seat: Optional[str] = None
    payment_token: Optional[str] = "OFFLINE_DEFERRED"


@app.post("/api/offline-order")
def queue_offline_order(order: OrderRequest):
    item = next((i for i in RETAIL_ITEMS if i["id"] == order.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    queued = {
        "order_id": f"ORD-{len(order_queue) + 1:04d}",
        "item_id": order.item_id,
        "item_name": item["name"],
        "vendor": item["vendor"],
        "station": item["station"],
        "quantity": order.quantity,
        "total": round(item["price"] * order.quantity, 2),
        "passenger_seat": order.passenger_seat,
        "payment_token": order.payment_token,
        "status": "QUEUED_OFFLINE",
    }
    order_queue.append(queued)

    # Approximate byte size of the JSON payload
    payload_bytes = len(json.dumps(queued).encode("utf-8"))

    return {
        "status": "queued",
        "order": queued,
        "queue_depth": len(order_queue),
        "payload_bytes": payload_bytes,
        "message": "Order stored locally. Will sync at next station platform connection.",
    }


@app.get("/api/sync-queue-status")
def get_sync_queue_status():
    total_bytes = sum(len(json.dumps(o).encode("utf-8")) for o in order_queue)
    return {
        "queue_depth": len(order_queue),
        "total_bytes": total_bytes,
        "orders": order_queue,
        "sync_ready": len(order_queue) > 0,
    }


@app.post("/api/simulate-sync")
def simulate_sync():
    count = len(order_queue)
    total_bytes = sum(len(json.dumps(o).encode("utf-8")) for o in order_queue)
    order_queue.clear()
    return {
        "status": "synced",
        "orders_synced": count,
        "bytes_transmitted": total_bytes,
        "message": f"Successfully synced {count} order(s) to central platform.",
    }


# --- RailOpt Simulation ---

def _calculate_siding_conflict(freight_delay: int):
    """
    Simulates a dual-track siding pass conflict.
    freight_delay (minutes) → fuel savings, track state, scheduling recommendation.
    """
    base_fuel_per_min = 2.3  # litres/min saved when siding conflict resolved
    efficiency_factor = min(1.0, freight_delay / 45)

    fuel_saved_litres = round(base_fuel_per_min * freight_delay * efficiency_factor, 2)
    co2_avoided_kg = round(fuel_saved_litres * 2.68, 2)
    cost_saved_cad = round(fuel_saved_litres * 1.42, 2)

    if freight_delay == 0:
        track_a = "CLEAR"
        track_b = "CLEAR"
        conflict_status = "NO_CONFLICT"
        recommendation = "All tracks nominal. No siding intervention required."
    elif freight_delay <= 10:
        track_a = "OCCUPIED_FREIGHT"
        track_b = "CLEAR"
        conflict_status = "MINOR_DELAY"
        recommendation = "Minor freight overlap. Passenger train proceeds at reduced speed through Napanee siding."
    elif freight_delay <= 25:
        track_a = "OCCUPIED_FREIGHT"
        track_b = "HOLD_PASSENGER"
        conflict_status = "SIDING_PASS_ACTIVE"
        recommendation = "Siding pass protocol active. Freight diverted to Track B. Passenger ETA adjusted +8 min."
    else:
        track_a = "CONFLICT_CRITICAL"
        track_b = "EMERGENCY_SIDING"
        conflict_status = "CRITICAL_INTERVENTION"
        recommendation = "Critical conflict. Emergency siding at Collins Bay activated. Dispatcher alerted. Fuel recovery protocol engaged."

    return {
        "freight_delay_min": freight_delay,
        "conflict_status": conflict_status,
        "track_a_state": track_a,
        "track_b_state": track_b,
        "recommendation": recommendation,
        "sdg7_metrics": {
            "fuel_saved_litres": fuel_saved_litres,
            "co2_avoided_kg": co2_avoided_kg,
            "cost_saved_cad": cost_saved_cad,
            "efficiency_pct": round(efficiency_factor * 100, 1),
        },
        "infrastructure_score": round(100 - (freight_delay * 1.5), 1),
    }


@app.get("/api/railopt/simulation")
def railopt_simulation(freight_delay: int = Query(default=0, ge=0, le=60)):
    return _calculate_siding_conflict(freight_delay)


# --- AI Personalization via OpenRouter ---

class PersonalizeRequest(BaseModel):
    item_id: str
    preferences: str


OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
PRIMARY_MODEL = "google/gemini-2.5-flash-lite"
FALLBACK_MODEL = "meta-llama/llama-3.3-70b-instruct"


async def _call_openrouter(model: str, prompt: str) -> str:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://railopt.ai",
        "X-Title": "RailOpt AI Express Market",
    }
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 120,
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()


@app.post("/api/ai/personalize")
async def ai_personalize(req: PersonalizeRequest):
    item = next((i for i in RETAIL_ITEMS if i["id"] == req.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if not OPENROUTER_API_KEY:
        return {
            "item_id": req.item_id,
            "model_used": "DEMO_MODE",
            "script": (
                f"Discover the {item['name']} by {item['vendor']} — "
                f"a perfect {item['station']} keepsake at {item['price_display']}. "
                f"Add a piece of local character to your journey today!"
            ),
            "warning": "OPENROUTER_API_KEY not set. Demo script returned.",
        }

    prompt = (
        f"You are RailOpt AI Concierge, a friendly onboard retail assistant on a VIA Rail train. "
        f"Write exactly 2 sentences of compelling marketing copy for this product: "
        f"'{item['name']}' by '{item['vendor']}' from {item['station']} station, priced at {item['price_display']}. "
        f"Tailor it to a passenger who described their preferences as: '{req.preferences}'. "
        f"Keep it warm, local, and under 60 words total."
    )

    model_used = PRIMARY_MODEL
    try:
        script = await _call_openrouter(PRIMARY_MODEL, prompt)
    except Exception:
        try:
            model_used = FALLBACK_MODEL
            script = await _call_openrouter(FALLBACK_MODEL, prompt)
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"AI service unavailable: {str(e)}")

    return {
        "item_id": req.item_id,
        "model_used": model_used,
        "script": script,
        "preferences_used": req.preferences,
    }


# --- Serve React frontend ---

STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/")
    def serve_index():
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.exists(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
else:
    @app.get("/")
    def root():
        return {"service": "RailOpt AI Express Market API", "version": "1.0.0", "status": "operational"}
