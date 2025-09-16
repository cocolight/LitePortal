export enum IconType {
  online_icon = 'online_icon',
  text_icon = 'text_icon',
  upload_icon = 'upload_icon'
}

export interface Link {
  id?: string;
  name: string;
  desc: string;
  int: string;
  ext: string;
  icon: string;
  iconType?: IconType;
  textIcon: string;
  uploadIcon: string;
}

export interface EditModalProps {
  visible: boolean;
  link: Link;
}
