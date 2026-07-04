export interface AppConfig {
  contact: {
    phone: string
    whatsapp: string
    email: string
  }
  currency: {
    usdToLbp: number
    primaryCurrency: string
  }
  business: {
    name: string
    address: string
    workingHours: string
  }
  payment: {
    testMode: boolean
    minimumAmount: number
  }
}

const CONFIG_DEFAULT_TEMPLATE: AppConfig = {
  contact: {
    phone: '+961-70-971-841',
    whatsapp: '96170971841',
    email: 'eweehalebanon@gmail.com'
  },
  currency: {
    usdToLbp: 89000,
    primaryCurrency: 'USD'
  },
  business: {
    name: 'Eweeha',
    address: 'Beirut, Lebanon',
    workingHours: '7 days a week — wedding season and beyond'
  },
  payment: {
    testMode: false,
    minimumAmount: 10
  }
}

export function createDefaultConfig(): AppConfig {
  return JSON.parse(JSON.stringify(CONFIG_DEFAULT_TEMPLATE)) as AppConfig
}
