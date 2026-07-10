# One-shot import of "Eweeha pricelist.xlsx" into local dev.db.
# Sheet names are the source of truth: matched DB cars are renamed,
# zone prices + quantity set; sheet-only cars are created hidden (available=0).
import sqlite3, re, datetime

# (sheet name, beirut, batroun/saida, further, qty)
SHEET = [
    ("Rolls-Royce Corniche 1970s Convertible", 600, 700, 750, 1),
    ("Excalibur 1978 Sedan - One of 101 ever made", 600, 700, 750, 1),
    ("Excalibur 1978 Convertible 2 doors", 600, 700, 750, 1),
    ("Bentley R Type 1953 Sedan", 600, 700, 750, 1),
    ("Rolls-Royce Silver Shadow 1960s", 600, 700, 750, 1),
    ("Mercedes Maybach S-Class", 400, 450, 500, 4),
    ("Rolls-Royce Ghost Series I - Classic White", 1500, 1600, 1750, 1),
    ("Rolls-Royce Ghost Series I - Black & White Edition", 1000, 1100, 1200, 1),
    ("Maserati Ghibli", 400, 450, 500, 1),
    ("Jaguar XJL", 250, 275, 300, 10),
    ("Jaguar XF", 150, 175, 225, 10),
    ('Chrysler 300C "Phantom Look" Custom Sedan', 150, 175, 225, 2),
    ("Chrysler 300C", 150, 175, 225, 2),
    ("Chevrolet Camaro Convertible", 250, 275, 300, 1),
    ("Mercedes-Benz G-Class", 400, 450, 500, 4),
    ("Maserati Levante", 400, 450, 500, 1),
    ("Porsche Cayenne", 250, 275, 300, 2),
    ("Chrysler 300C Stretch Limousine", 500, 600, 700, 4),
    ("BMW X5 Stretch Limousine", 500, 600, 700, 1),
    ("Daimler DS420 Half-Limousine", 600, 700, 750, 1),
    ("Cadillac Eldorado 1973 Convertible White", 400, 450, 500, 1),
    ("Cadillac Eldorado 1973 Convertible Red", 400, 450, 500, 1),
    ("Maserati Quattroporte", 400, 450, 500, 2),
    ("Range Rover Sport 2019", 400, 450, 500, 2),
    ("Ford Thunderbird 1960 Convertible", 400, 450, 500, 1),
    ("Porsche Panamera GTS Sport", 250, 275, 300, 1),
    ("Plymouth Cranbrook 1951 Convertible", 400, 450, 500, 1),
    ("Mercedes C Class Sedan", 250, 275, 300, 1),
    ("Mercedes E Class convertible", 250, 275, 300, 1),
    ("Peugeot 203 Vintage 1950s", 400, 450, 500, 1),
    ("Lamborghini Urus 2024", 1000, 1100, 1200, 1),
    ("Desoto 1936", 450, 500, 550, 1),
    ("Plymouth 1950 red convertible", 450, 500, 550, 1),
    ("Bentley Continental", 500, 600, 700, 2),
    ("Maserati GranCabrio 2018", 500, 600, 700, 1),
    ("Rolls-Royce Cullinan 2022", 2500, 2800, 3000, 1),
    ("S Class 2018 White", 500, 550, 600, 1),
    ("Range Rover 2024", 500, 550, 600, 1),
    ("Austin Cambridge 1957", 400, 450, 500, 1),
]

# sheet name -> existing DB name
MATCH = {
    "Rolls-Royce Corniche 1970s Convertible": "Rolls-Royce Corniche",
    "Excalibur 1978 Convertible 2 doors": "Excalibur Classic",
    "Bentley R Type 1953 Sedan": "Bentley Mark VI",
    "Rolls-Royce Silver Shadow 1960s": "Rolls-Royce Silver Shadow",
    "Mercedes Maybach S-Class": "Mercedes-Maybach S-Class",
    "Rolls-Royce Ghost Series I - Classic White": "Rolls-Royce Ghost",
    "Maserati Ghibli": "Maserati Ghibli",
    "Jaguar XJL": "Jaguar XJ",
    "Jaguar XF": "Jaguar XF",
    "Chrysler 300C": "Chrysler 300",
    "Chevrolet Camaro Convertible": "Chevrolet Camaro Convertible",
    "Mercedes-Benz G-Class": "Mercedes-Benz G-Class",
    "Maserati Levante": "Maserati Levante",
    "Porsche Cayenne": "Porsche Cayenne",
    "Chrysler 300C Stretch Limousine": "Chrysler 300 Stretch Limousine",
    "BMW X5 Stretch Limousine": "BMW X5 Stretch Limousine",
    "Daimler DS420 Half-Limousine": "Daimler DS420 Limousine",
    "Maserati Quattroporte": "Maserati Quattroporte",
    "Range Rover Sport 2019": "Range Rover Sport",
    "Porsche Panamera GTS Sport": "Porsche Panamera",
    "Mercedes E Class convertible": "Mercedes-Benz E-Class Cabriolet",
    "Bentley Continental": "Bentley Flying Spur",
    "Maserati GranCabrio 2018": "Maserati GranCabrio",
    "S Class 2018 White": "Mercedes-Benz S-Class",
}

PLACEHOLDER = "/images/fleet/standard.svg"

def slugify(name):
    s = re.sub(r"[^\w\s-]", "", name.lower())
    return re.sub(r"[\s_-]+", "-", s).strip("-")

db = sqlite3.connect("dev.db")
cur = db.cursor()
existing = {r[0]: r[1] for r in cur.execute("select name, id from vehicles")}

updated, created = [], []
for name, p1, p2, p3, qty in SHEET:
    db_name = MATCH.get(name)
    if db_name:
        if db_name not in existing:
            raise SystemExit(f"expected DB car not found: {db_name}")
        cur.execute(
            """update vehicles set name=?, price_beirut=?, price_batroun_saida=?,
               price_further=?, price=?, quantity=? where id=?""",
            (name, p1, p2, p3, p1, qty, existing[db_name]),
        )
        updated.append((db_name, name))
    else:
        slug = base = slugify(name)
        i = 1
        while cur.execute("select 1 from vehicles where slug=? or id=?", (slug, slug)).fetchone():
            slug = f"{base}-{i}"; i += 1
        cur.execute(
            """insert into vehicles (id, slug, name, category, capacity, price, features,
               description, main_image, gallery_images, seating, luggage, transmission,
               available, quantity, show_on_homepage, display_order,
               price_beirut, price_batroun_saida, price_further, created_at)
               values (?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,0,0,?,?,?,?)""",
            (slug, slug, name, "luxury", "Contact for details", p1, "[]",
             "Photos & details coming soon.", PLACEHOLDER, "[]", "", "", "",
             qty, p1, p2, p3, datetime.datetime.utcnow().isoformat()),
        )
        created.append(name)

db.commit()
sheet_names = {s[0] for s in SHEET}
matched_db = set(MATCH.values())
leftover = [n for n in existing if n not in matched_db and n not in sheet_names]

print(f"updated ({len(updated)}):")
for old, new in updated:
    print(f"  {old}  ->  {new}" if old != new else f"  {old}")
print(f"\ncreated hidden ({len(created)}):")
for n in created:
    print(f"  {n}")
print(f"\nDB cars not on sheet, untouched & unpriced ({len(leftover)}):")
for n in leftover:
    print(f"  {n}")
