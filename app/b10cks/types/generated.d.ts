export interface B10cksItem {
  id: string
  block: string
}

export interface B10cksMenu extends B10cksItem {
  items?: B10cksMenuitem[]
  title?: string
}

export interface B10cksMenuitem extends B10cksItem {
  link?: B10cksLink
  label?: string
}

export interface B10cksButton extends B10cksItem {
  link?: B10cksLink
  size?: 'default' | 'xs' | 'sm' | 'lg'
  label?: string
  variant: 'default' | 'primary' | 'accent' | 'outline' | 'ghost' | 'link'
  disabled?: boolean
}

export interface B10cksConfig extends B10cksItem {
  actions?: B10cksButton[]
  mainMenu?: B10cksMenuitem[]
  siteName?: string
  copyright?: string
  footerMenu?: B10cksMenu[]
  footerText?: string
}

export interface B10cksPage extends B10cksItem {
  body?: B10cksItem[]
  meta?: any
}
