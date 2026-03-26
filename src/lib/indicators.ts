export type IndicatorTier = 'free' | 'pro';
export type IndicatorCategory = 'Overview' | 'Economy' | 'Labor' | 'Society' | 'Energy' | 'Trade';

export interface Indicator {
  id: string;
  name: string;
  format: 'billions' | 'millions' | 'percent' | 'number';
  tier: IndicatorTier;
  category: IndicatorCategory;
}

export const INDICATORS: Indicator[] = [
  // Overview (Free)
  { id: 'NY.GDP.MKTP.CD', name: 'GDP (USD)', format: 'billions', tier: 'free', category: 'Overview' },
  { id: 'SP.POP.TOTL', name: 'Population', format: 'millions', tier: 'free', category: 'Overview' },
  { id: 'SL.UEM.TOTL.ZS', name: 'Unemployment Rate (%)', format: 'percent', tier: 'free', category: 'Overview' },
  { id: 'FP.CPI.TOTL.ZG', name: 'CPI Inflation (%)', format: 'percent', tier: 'free', category: 'Overview' },
  { id: 'SP.DYN.LE00.IN', name: 'Life Expectancy (years)', format: 'number', tier: 'free', category: 'Overview' },

  // Economy (Pro)
  { id: 'NY.GDP.PCAP.CD', name: 'GDP per Capita (USD)', format: 'number', tier: 'pro', category: 'Economy' },
  { id: 'NY.GDP.MKTP.KD.ZG', name: 'GDP Growth Rate (%)', format: 'percent', tier: 'pro', category: 'Economy' },
  { id: 'NY.GNP.PCAP.CD', name: 'GNI per Capita (USD)', format: 'number', tier: 'pro', category: 'Economy' },
  { id: 'NY.GNP.PCAP.PP.CD', name: 'GNI per Capita PPP (USD)', format: 'number', tier: 'pro', category: 'Economy' },
  { id: 'NE.EXP.GNFS.ZS', name: 'Exports (% of GDP)', format: 'percent', tier: 'pro', category: 'Economy' },
  { id: 'NE.IMP.GNFS.ZS', name: 'Imports (% of GDP)', format: 'percent', tier: 'pro', category: 'Economy' },
  { id: 'BX.KLT.DINV.WD.GD.ZS', name: 'FDI Net Inflows (% of GDP)', format: 'percent', tier: 'pro', category: 'Economy' },
  { id: 'GC.DOD.TOTL.GD.ZS', name: 'Government Debt (% of GDP)', format: 'percent', tier: 'pro', category: 'Economy' },
  { id: 'GC.REV.XGRT.GD.ZS', name: 'Government Revenue (% of GDP)', format: 'percent', tier: 'pro', category: 'Economy' },
  { id: 'NY.GDS.TOTL.ZS', name: 'Gross Savings (% of GDP)', format: 'percent', tier: 'pro', category: 'Economy' },
  { id: 'FI.RES.TOTL.CD', name: 'Total Reserves (USD)', format: 'billions', tier: 'pro', category: 'Economy' },
  { id: 'PA.NUS.FCRF', name: 'Exchange Rate (per USD)', format: 'number', tier: 'pro', category: 'Economy' },
  { id: 'IC.BUS.EASE.XQ', name: 'Ease of Doing Business', format: 'number', tier: 'pro', category: 'Economy' },
  { id: 'NE.GDI.TOTL.ZS', name: 'Gross Capital Formation (% of GDP)', format: 'percent', tier: 'pro', category: 'Economy' },
  { id: 'NY.GDP.DEFL.KD.ZG', name: 'GDP Deflator Inflation (%)', format: 'percent', tier: 'pro', category: 'Economy' },

  // Labor (Pro)
  { id: 'SL.TLF.CACT.ZS', name: 'Labor Force Participation (%)', format: 'percent', tier: 'pro', category: 'Labor' },
  { id: 'SL.UEM.1524.ZS', name: 'Youth Unemployment (%)', format: 'percent', tier: 'pro', category: 'Labor' },
  { id: 'SL.TLF.CACT.FE.ZS', name: 'Female Labor Participation (%)', format: 'percent', tier: 'pro', category: 'Labor' },
  { id: 'SL.EMP.TOTL.SP.ZS', name: 'Employment Ratio (%)', format: 'percent', tier: 'pro', category: 'Labor' },
  { id: 'SL.AGR.EMPL.ZS', name: 'Agriculture Employment (%)', format: 'percent', tier: 'pro', category: 'Labor' },
  { id: 'SL.IND.EMPL.ZS', name: 'Industry Employment (%)', format: 'percent', tier: 'pro', category: 'Labor' },
  { id: 'SL.SRV.EMPL.ZS', name: 'Services Employment (%)', format: 'percent', tier: 'pro', category: 'Labor' },
  { id: 'SL.TLF.TOTL.IN', name: 'Total Labor Force', format: 'millions', tier: 'pro', category: 'Labor' },

  // Society (Pro)
  { id: 'SP.DYN.TFRT.IN', name: 'Fertility Rate', format: 'number', tier: 'pro', category: 'Society' },
  { id: 'SP.DYN.CDRT.IN', name: 'Death Rate (per 1,000)', format: 'number', tier: 'pro', category: 'Society' },
  { id: 'SP.DYN.CBRT.IN', name: 'Birth Rate (per 1,000)', format: 'number', tier: 'pro', category: 'Society' },
  { id: 'SP.URB.TOTL.IN.ZS', name: 'Urban Population (%)', format: 'percent', tier: 'pro', category: 'Society' },
  { id: 'SP.POP.65UP.TO.ZS', name: 'Population 65+ (%)', format: 'percent', tier: 'pro', category: 'Society' },
  { id: 'SP.POP.0014.TO.ZS', name: 'Population 0-14 (%)', format: 'percent', tier: 'pro', category: 'Society' },
  { id: 'SE.ADT.LITR.ZS', name: 'Literacy Rate (%)', format: 'percent', tier: 'pro', category: 'Society' },
  { id: 'SE.XPD.TOTL.GD.ZS', name: 'Education Spending (% of GDP)', format: 'percent', tier: 'pro', category: 'Society' },
  { id: 'SE.TER.ENRR', name: 'University Enrollment (%)', format: 'percent', tier: 'pro', category: 'Society' },
  { id: 'SH.XPD.CHEX.GD.ZS', name: 'Health Spending (% of GDP)', format: 'percent', tier: 'pro', category: 'Society' },
  { id: 'SH.MED.PHYS.ZS', name: 'Physicians (per 1,000)', format: 'number', tier: 'pro', category: 'Society' },
  { id: 'IT.NET.USER.ZS', name: 'Internet Users (%)', format: 'percent', tier: 'pro', category: 'Society' },

  // Energy (Pro)
  { id: 'EN.ATM.CO2E.PC', name: 'CO2 Emissions per Capita', format: 'number', tier: 'pro', category: 'Energy' },
  { id: 'EG.USE.PCAP.KG.OE', name: 'Energy Use per Capita', format: 'number', tier: 'pro', category: 'Energy' },
  { id: 'EG.FEC.RNEW.ZS', name: 'Renewable Energy (%)', format: 'percent', tier: 'pro', category: 'Energy' },
  { id: 'AG.LND.FRST.ZS', name: 'Forest Area (%)', format: 'percent', tier: 'pro', category: 'Energy' },
  { id: 'EN.ATM.CO2E.KT', name: 'CO2 Emissions Total (kt)', format: 'number', tier: 'pro', category: 'Energy' },

  // Trade (Pro)
  { id: 'TG.VAL.TOTL.GD.ZS', name: 'Trade (% of GDP)', format: 'percent', tier: 'pro', category: 'Trade' },
  { id: 'TX.VAL.TECH.MF.ZS', name: 'High-tech Exports (%)', format: 'percent', tier: 'pro', category: 'Trade' },
  { id: 'BN.CAB.XOKA.GD.ZS', name: 'Current Account (% of GDP)', format: 'percent', tier: 'pro', category: 'Trade' },
  { id: 'TM.TAX.MRCH.WM.AR.ZS', name: 'Average Tariff Rate (%)', format: 'percent', tier: 'pro', category: 'Trade' },
  { id: 'SI.POV.GINI', name: 'GINI Index', format: 'number', tier: 'pro', category: 'Trade' },
];

export const FREE_INDICATORS = INDICATORS.filter((i) => i.tier === 'free');
export const PRO_INDICATORS = INDICATORS.filter((i) => i.tier === 'pro');

export const CATEGORIES: IndicatorCategory[] = ['Overview', 'Economy', 'Labor', 'Society', 'Energy', 'Trade'];

export function getIndicatorsByCategory(category: IndicatorCategory): Indicator[] {
  return INDICATORS.filter((i) => i.category === category);
}
