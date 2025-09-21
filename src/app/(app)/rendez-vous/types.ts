export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  address: string;
  avatar: string;
}

export interface SearchFilters {
  specialty: string;
  location: string;
}
