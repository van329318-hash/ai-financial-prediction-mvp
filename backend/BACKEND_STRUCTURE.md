# AI Financial Prediction MVP - Backend Server

## Cấu Trúc Toàn Bộ Backend

### Thư Mục Backend
```
backend/
├── src/
│   ├── server.js                 # Entry point chính
│   ├── config/
│   │   ├── database.js           # Kết nối database
│   │   ├── redis.js              # Kết nối Redis
│   │   └── constants.js          # Hằng số ứng dụng
│   │
│   ├── models/
│   │   ├── gameModel.js          # Game logic model
│   │   ├── betModel.js           # Betting logic
│   │   ├── walletModel.js        # Wallet/balance
│   │   └── userModel.js          # User management
│   │
│   ├── services/
│   │   ├── gameService.js        # Game business logic
│   │   ├── aiService.js          # AI engine integration
│   │   ├── walletService.js      # Wallet operations
│   │   └── analyticsService.js   # Stats & analytics
│   │
│   ├── controllers/
│   │   ├── gameController.js     # Game endpoints
│   │   ├── authController.js     # Auth endpoints
│   │   ├── userController.js     # User endpoints
│   │   ├── walletController.js   # Wallet endpoints
│   │   └── adminController.js    # Admin endpoints
│   │
│   ├── routes/
│   │   ├── authRoutes.js         # Auth routes
│   │   ├── gameRoutes.js         # Game routes
│   │   ├── userRoutes.js         # User routes
│   │   ├── walletRoutes.js       # Wallet routes
│   │   └── adminRoutes.js        # Admin routes
│   │
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   ├── validation.js         # Input validation
│   │   ├── errorHandler.js       # Error handling
│   │   └── rateLimiter.js        # Rate limiting
│   │
│   ├── websocket/
│   │   ├── socketHandler.js      # Socket.io setup
│   │   ├── gameEvents.js         # Game events
│   │   ├── userEvents.js         # User events
│   │   └── eventEmitter.js       # Event manager
│   │
│   ├── validators/
│   │   ├── gameValidator.js      # Game validation
│   │   ├── userValidator.js      # User validation
│   │   └── schemas.js            # Joi schemas
│   │
│   ├── utils/
│   │   ├── logger.js             # Winston logger
│   │   ├── helpers.js            # Utility functions
│   │   ├── constants.js          # Constants
│   │   └── errors.js             # Custom errors
│   │
│   └── database/
│       ├── migrations/           # DB migrations
│       └── seeds/                # Sample data
│
├── prisma/
│   └── schema.prisma            # Prisma schema
│
├── logs/                        # Application logs
├── .env.example                 # Environment template
├── .gitignore
├── package.json
├── Dockerfile.backend
└── README.md
```

### Lệnh Khởi Động
```bash
# Cài đặt
npm install

# Thiết lập database
npx prisma migrate dev
npx prisma db seed

# Chạy development
npm run dev

# Chạy production
NODE_ENV=production npm start

# Test
npm test
```

### Cấu Hình (.env)
```
NODE_ENV=development
PORT=3001

DATABASE_URL=postgresql://user:password@localhost:5432/betting_game
REDIS_URL=redis://localhost:6379

JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRE=7d

GAME_ROUND_DURATION=60
BETTING_WINDOW=50
MIN_BET=10
MAX_BET=10000
INITIAL_BALANCE=1000

AI_ENGINE_URL=http://localhost:5000
AI_MODEL_VERSION=v1.0

LOG_LEVEL=debug
FRONTEND_URL=http://localhost:3000
```
