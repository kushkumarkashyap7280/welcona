You said
// This is your Prisma schema file,

// learn more about it in the docs: https://pris.ly/d/prisma-schema



// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?

// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init



generator client {

provider = "prisma-client"

output = "../lib/generated/prisma"

}



datasource db {

provider = "postgresql"

}





model User {

id String @id @default(uuid())

verified Boolean @default(false)

email String @unique

mobile String @unique

googleId String @unique

avatar String?

fullName String?

orders Order[]

cart Cart?

addresses Address[]

ratings rating[]

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt

}



model Address {

id String @id @default(uuid())

userId String

user User @relation(fields: [userId], references: [id])

line1 String

line2 String?

city String

state String

postalCode String

country String

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt

}





model Category {

id String @id @default(uuid())

name String

image String?

description String?

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt



products Product[]

}





model Product {

id String @id @default(uuid())

quantity Int

image String?

name String

description String?

price Float

discount Float?

categoryId String

category Category @relation(fields: [categoryId], references: [id])

cartItems CartItem[]

orderItems OrderItem[]

ratings rating[]

tags String[]

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt

}





model rating {

id String @id @default(uuid())

userId String

user User @relation(fields: [userId], references: [id])

productId String

product Product @relation(fields: [productId], references: [id])

rating Int

review String?

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt

}









model Cart {

id String @id @default(uuid())

userId String @unique

user User @relation(fields: [userId], references: [id])

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt



cartItems CartItem[]

}





model CartItem {

id String @id @default(uuid())

cartId String

cart Cart @relation(fields: [cartId], references: [id])

productId String

product Product @relation(fields: [productId], references: [id])

quantity Int

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt

}





model Order {

id String @id @default(uuid())

userId String

user User @relation(fields: [userId], references: [id])

total Float

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt



orderItems OrderItem[]

}



model OrderItem {

id String @id @default(uuid())

orderId String

order Order @relation(fields: [orderId], references: [id])

productId String

product Product @relation(fields: [productId], references: [id])

quantity Int

price Float

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt

}







i m currently working on project .. that a factory owner want a e coomnerce webstie for his business

Home

About us

Products

Contact

About us





Welcome to Welcona

Welcona was born in 2008. The mission was to create a good product that is honestly made and sincerely sold.

Welcona brand of faucets and accessories stand on two professed benchmarks of constant innovation and uncompromising quality.



Interesting facts

5

Awards

233

Project

857

Happy clients

About Us

To evolve is to last forever. With this simple philosophy, the brand Welcona was born in 2008. The mission was to create a good product that is honestly made and sincerely sold.

contact info

Hari Om Super Industry

Address: 1/2508, Near Nutan School, Ram Nagar, Shahdara, Delhi, 110032

Email: welconacpfitting@gmail.com









Please assign a menu to the primary menu location under Menus Settings

© 2022 All rights reserved.

momwrites

handshose

non liner

Autoplex

PT Sheng Yue Industry Indonesia

Tren rambut pria

PaceSal Vibes

Inspirasi Hidup Bahagia

5 Tren Desain Grafis | Kobra Insight

Resurge Vintage - Eksplorasi Passion, Tren, dan Inspirasi Lintas Zaman

Dunia Baking, Tren Roti, dan Inspirasi Kuliner - MaggieBreads

Tribun Warga | Suara Rakyat, Kabar Nyata.

Lensa Masyarakat

Lensa Global

Muscle Old School

slot gacor

gacor

mimislot baht items escpcially taps .. showers etc .. so tell me if something etc needed to change ?

Gemini said
This is a solid start for a MERN stack e-commerce backend. Since you're building this for a factory owner (Welcona) specializing in CP fittings, taps, and showers, there are some industry-specific details and standard e-commerce practices you should consider adding to your Prisma schema to make it more professional and scalable.