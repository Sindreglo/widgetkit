export interface Resource {
  id: string;
  name: string;
  avatar?: string;
}

export interface TimelineItem {
  id: string;
  resourceId: string;
  name: string;
  color: string;
  start: Date;
  end: Date;
  description?: string;
}
