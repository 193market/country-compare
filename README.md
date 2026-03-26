# CountryCompare

Compare economies of 200+ countries with interactive charts.

## Features

- Select any 2 countries from 200+ options
- 5 economic indicators: GDP, Population, Unemployment, CPI Inflation, Life Expectancy
- Interactive line charts (2000-2024)
- Latest data comparison table
- Responsive design (mobile-friendly)

## Tech Stack

- **Framework**: Next.js (App Router, TypeScript)
- **Charts**: Chart.js + react-chartjs-2
- **Styling**: Tailwind CSS
- **Data**: World Bank Open Data API (free, no API key required)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Routes

- `GET /api/countries` - List of 200+ countries
- `GET /api/compare?countries=KR,JP&indicator=NY.GDP.MKTP.CD` - Compare indicator data

## Available Indicators

| ID | Name |
|----|------|
| NY.GDP.MKTP.CD | GDP (USD) |
| SP.POP.TOTL | Population |
| SL.UEM.TOTL.ZS | Unemployment Rate (%) |
| FP.CPI.TOTL.ZG | CPI Inflation (%) |
| SP.DYN.LE00.IN | Life Expectancy (years) |

## Data Source

[World Bank Open Data](https://data.worldbank.org/) - Free and open access to global development data.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## License

MIT
