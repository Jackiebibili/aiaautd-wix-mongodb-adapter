const whitelistOrigins = [
  'http://localhost:4200',
  process.env.HOST_SITE_URL,
  process.env.HOST_SITE_URL_OVER_SSL,
];

const corsOptions = {
  credentials: true,
  origin: (origin, cb) => {
    if (whitelistOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
};

module.exports = { corsOptions };
