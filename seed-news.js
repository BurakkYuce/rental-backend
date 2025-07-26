// seed-news.js - Script to seed news data
const mongoose = require('mongoose');
const News = require('./src/models/News');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/rentaly');
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedNews = async () => {
  try {
    // Clear existing news
    await News.deleteMany({});
    console.log('🗑️ Cleared existing news');

    const newsArticles = [
      {
        title: "Electric Vehicles Revolution in Car Rental Industry",
        slug: "electric-vehicles-revolution-in-car-rental-industry",
        excerpt: "The car rental industry is experiencing a major transformation with the rapid adoption of electric vehicles. Discover how this shift is changing the landscape for both rental companies and customers.",
        content: "The automotive industry is witnessing an unprecedented shift towards electric vehicles (EVs), and the car rental sector is at the forefront of this revolution. Major rental companies worldwide are investing heavily in electric fleets, recognizing both the environmental benefits and the growing consumer demand for sustainable transportation options. This transformation is not just about replacing gasoline engines with electric motors; it's about reimagining the entire rental experience. From streamlined charging infrastructure at rental locations to mobile apps that help customers locate charging stations during their trips, the industry is adapting to meet the needs of the electric age. Customers are increasingly choosing electric vehicles for their rentals, driven by factors such as lower operating costs, reduced environmental impact, and the unique driving experience that EVs provide. The quiet operation, instant torque, and advanced technology features found in modern electric vehicles are creating new expectations for rental car experiences.",
        featuredImage: {
          url: "https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=800&h=600&fit=crop",
          alt: "Electric car charging station"
        },
        author: "Sarah Johnson",
        category: "Technology",
        tags: ["electric", "vehicles", "sustainability", "technology"],
        publishedAt: new Date("2025-01-15"),
        readingTime: 4,
        viewCount: 245,
        status: "published"
      },
      {
        title: "Top 10 Road Trip Destinations for Summer 2025",
        slug: "top-10-road-trip-destinations-for-summer-2025",
        excerpt: "Planning your next adventure? Explore our curated list of the most breathtaking road trip destinations that promise unforgettable experiences and stunning landscapes.",
        content: "Summer 2025 presents incredible opportunities for memorable road trips across diverse landscapes and cultures. Our expertly curated list features destinations that offer the perfect blend of natural beauty, cultural richness, and accessible routes suitable for rental vehicles. From the rugged coastlines of Big Sur in California to the mystical landscapes of Iceland's Ring Road, these destinations promise adventures that will create lasting memories. Each destination has been selected based on road conditions, seasonal accessibility, and the unique experiences they offer to travelers. Whether you're seeking dramatic mountain vistas, pristine beaches, historic towns, or vibrant cities, our list caters to every type of traveler. We've also included practical information about the best times to visit, recommended vehicle types, and must-see stops along each route. The beauty of a road trip lies in the freedom it provides – the ability to explore at your own pace, discover hidden gems, and create spontaneous adventures. With the right rental vehicle and proper planning, these destinations will provide the backdrop for some of your most treasured travel experiences.",
        featuredImage: {
          url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop",
          alt: "Scenic mountain road trip view"
        },
        author: "Michael Chen",
        category: "Travel Tips",
        tags: ["road trip", "travel", "summer", "destinations"],
        publishedAt: new Date("2025-01-10"),
        readingTime: 6,
        viewCount: 892,
        status: "published"
      },
      {
        title: "Understanding Car Rental Insurance: A Complete Guide",
        slug: "understanding-car-rental-insurance-complete-guide",
        excerpt: "Navigate the complex world of car rental insurance with confidence. Learn about different coverage options, what's included, and how to make informed decisions that protect you and your wallet.",
        content: "Car rental insurance can be one of the most confusing aspects of renting a vehicle, but understanding your options is crucial for both financial protection and peace of mind. This comprehensive guide breaks down the various types of coverage available, from basic liability insurance to comprehensive damage waivers, helping you make informed decisions based on your specific needs and circumstances. Many travelers are unaware that their personal auto insurance or credit card benefits may already provide coverage for rental vehicles, potentially saving hundreds of dollars on unnecessary duplicate coverage. We'll explore how to verify existing coverage, understand the limitations of different policies, and identify situations where additional rental insurance makes sense. The guide also covers international rental considerations, as insurance requirements and options can vary significantly between countries. We'll discuss common scenarios where rental insurance claims occur, such as minor parking lot incidents, weather-related damage, and theft, providing real-world examples of how different coverage types respond to these situations. By the end of this guide, you'll have the knowledge to confidently navigate rental insurance options and select coverage that provides adequate protection without overpaying for unnecessary extras.",
        featuredImage: {
          url: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop",
          alt: "Car insurance documents and keys"
        },
        author: "Emily Rodriguez",
        category: "Safety",
        tags: ["insurance", "safety", "rental", "guide"],
        publishedAt: new Date("2025-01-05"),
        readingTime: 8,
        viewCount: 567,
        status: "published"
      },
      {
        title: "Smart Car Technologies Transforming Modern Rentals",
        slug: "smart-car-technologies-transforming-modern-rentals",
        excerpt: "From autonomous features to connected services, discover how cutting-edge automotive technologies are revolutionizing the car rental experience and what it means for your next trip.",
        content: "The integration of smart technologies in rental vehicles is fundamentally changing how we interact with and experience rented cars. Today's rental fleets increasingly feature advanced driver assistance systems (ADAS), including adaptive cruise control, lane departure warnings, automatic emergency braking, and parking assistance technologies that make driving safer and more comfortable for renters of all experience levels. Connected car technologies are enabling new services such as remote vehicle unlocking through smartphone apps, real-time vehicle diagnostics, and GPS tracking for enhanced security. These innovations are particularly valuable in the rental context, where customers may be unfamiliar with the vehicle and driving in new locations. Infotainment systems now seamlessly integrate with personal devices, allowing renters to access their music, navigation preferences, and contacts instantly. Some rental companies are experimenting with facial recognition and biometric systems to streamline the pickup process, while others are implementing blockchain technology for secure, transparent transactions. The data collected by these smart systems is also helping rental companies optimize their fleets, predict maintenance needs, and improve customer service. As autonomous driving technology continues to advance, we're beginning to see pilot programs for self-driving rental vehicles in controlled environments, pointing toward a future where the rental experience may be completely reimagined.",
        featuredImage: {
          url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
          alt: "Modern car dashboard with smart technology"
        },
        author: "David Park",
        category: "Technology",
        tags: ["smart cars", "technology", "innovation", "future"],
        publishedAt: new Date("2024-12-28"),
        readingTime: 5,
        viewCount: 423,
        status: "published"
      },
      {
        title: "Sustainable Travel: Eco-Friendly Car Rental Choices",
        slug: "sustainable-travel-eco-friendly-car-rental-choices",
        excerpt: "Make environmentally conscious decisions on your next trip. Learn about hybrid and electric rental options, carbon offset programs, and sustainable travel practices that make a difference.",
        content: "As environmental awareness continues to grow, travelers are increasingly seeking ways to reduce their carbon footprint, and car rental choices play a significant role in sustainable travel practices. The rental industry has responded with expanded offerings of hybrid and electric vehicles, comprehensive carbon offset programs, and initiatives to reduce the environmental impact of their operations. Modern hybrid vehicles in rental fleets can achieve fuel efficiency ratings of 50+ MPG, significantly reducing emissions compared to traditional gasoline vehicles. Electric vehicle rentals, while still growing in availability, offer zero local emissions and can be powered by renewable energy sources, making them the most sustainable option for short to medium-distance travel. Beyond vehicle selection, many rental companies now offer carbon offset programs that allow customers to neutralize the environmental impact of their trips through investments in renewable energy projects, reforestation initiatives, and clean technology development. This guide explores how to identify and choose eco-friendly rental options, understand the real-world environmental impact of different vehicle types, and incorporate sustainable practices throughout your travel experience. We'll also discuss the growing network of charging infrastructure for electric rentals, tips for maximizing fuel efficiency in any rental vehicle, and how to evaluate the environmental claims made by different rental companies.",
        featuredImage: {
          url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop",
          alt: "Green leaves on car representing eco-friendly travel"
        },
        author: "Lisa Thompson",
        category: "Industry Updates",
        tags: ["sustainability", "eco-friendly", "environment", "green travel"],
        publishedAt: new Date("2024-12-20"),
        readingTime: 7,
        viewCount: 634,
        status: "published"
      }
    ];

    await News.insertMany(newsArticles);
    console.log(`✅ Successfully seeded ${newsArticles.length} news articles`);
    
    // Verify the seeding
    const count = await News.countDocuments();
    console.log(`📊 Total news articles in database: ${count}`);
    
  } catch (error) {
    console.error('❌ Error seeding news:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seeding
connectDB().then(() => {
  seedNews();
});