import { createClient } from '@libsql/client'

const c = createClient({ url: 'file:dev.db' })
const mode = process.argv[2] || 'seed'

if (mode === 'seed') {
  const cols = await c.execute('PRAGMA table_info(vehicles)')
  console.log('columns:', cols.rows.map(r => `${r.name}${r.notnull ? '*' : ''}`).join(', '))
  const now = new Date().toISOString()
  const cars = [
    ['test-car-1', 'test-classic-rolls', 'TEST Classic Rolls', 250],
    ['test-car-2', 'test-white-convertible', 'TEST White Convertible', 180],
  ]
  for (const [id, slug, name, price] of cars) {
    await c.execute({
      sql: `INSERT OR REPLACE INTO vehicles (
        id, slug, name, category, capacity, price, features, description,
        main_image, gallery_images, seating, luggage, transmission,
        available, quantity, show_on_homepage, display_order, created_at, max_passengers
      ) VALUES (?, ?, ?, 'luxury', '4 passengers', ?, '[]', 'test car',
        'https://res.cloudinary.com/demo/image/upload/sample.jpg', '[]', '4', '2', 'Automatic',
        1, 1, 1, 1, ?, 4)`,
      args: [id, slug, name, price, now],
    })
    console.log('seeded', name)
  }
} else {
  const res = await c.execute("DELETE FROM vehicles WHERE id LIKE 'test-car-%'")
  console.log('deleted rows:', res.rowsAffected)
}
c.close()
