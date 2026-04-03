import api from './api';
import { fetchCachedData, invalidateCachedData, prefetchCachedData } from './requestCache';

const VEHICLES_TTL = 30000;
const VEHICLE_DETAIL_TTL = 60000;
const METADATA_TTL = 5 * 60 * 1000;

const getVehiclesKey = (filters = {}) => ['vehicles', filters];
const getVehicleKey = (id) => ['vehicle', id];
const getCategoriesKey = () => ['vehicle-categories'];
const getAgenciesKey = () => ['vehicle-agencies'];

const fetchVehiclesFromApi = async (filters = {}) => {
  const queryParams = new URLSearchParams();

  if (filters.category) queryParams.append('category', filters.category);
  if (filters.agency) queryParams.append('agency', filters.agency);
  if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
  if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
  if (filters.transmission) queryParams.append('transmission', filters.transmission);
  if (filters.fuelType) queryParams.append('fuelType', filters.fuelType);
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.startDate) queryParams.append('startDate', filters.startDate);
  if (filters.endDate) queryParams.append('endDate', filters.endDate);
  if (filters.page) queryParams.append('page', filters.page);
  if (filters.limit) queryParams.append('limit', filters.limit);

  const response = await api.get(`/vehicles?${queryParams.toString()}`);
  return response.data;
};

const fetchVehicleByIdFromApi = async (id) => {
  const response = await api.get(`/vehicles/${id}`);
  return response.data;
};

const fetchCategoriesFromApi = async () => {
  const response = await api.get('/categories');
  return response.data;
};

const fetchAgenciesFromApi = async () => {
  const response = await api.get('/agencies');
  return response.data;
};

export const vehicleService = {
  getVehicles: async (filters = {}, options = {}) => {
    return fetchCachedData({
      key: getVehiclesKey(filters),
      ttl: options.ttl ?? VEHICLES_TTL,
      force: options.force ?? false,
      queryFn: () => fetchVehiclesFromApi(filters)
    });
  },

  getVehicleById: async (id, options = {}) => fetchCachedData({
    key: getVehicleKey(id),
    ttl: options.ttl ?? VEHICLE_DETAIL_TTL,
    force: options.force ?? false,
    queryFn: () => fetchVehicleByIdFromApi(id)
  }),

  updateVehicleAvailability: async (id, isAvailable) => {
    const response = await api.put(`/vehicles/${id}`, { isAvailable });
    invalidateCachedData('["vehicles"');
    invalidateCachedData(`["vehicle","${id}"]`);
    return response.data;
  },

  getCategories: async (options = {}) => fetchCachedData({
    key: getCategoriesKey(),
    ttl: options.ttl ?? METADATA_TTL,
    force: options.force ?? false,
    queryFn: fetchCategoriesFromApi
  }),

  getAgencies: async (options = {}) => fetchCachedData({
    key: getAgenciesKey(),
    ttl: options.ttl ?? METADATA_TTL,
    force: options.force ?? false,
    queryFn: fetchAgenciesFromApi
  }),

  prefetchVehicles: async (filters = {}, options = {}) => prefetchCachedData({
    key: getVehiclesKey(filters),
    ttl: options.ttl ?? VEHICLES_TTL,
    queryFn: () => fetchVehiclesFromApi(filters)
  }),

  prefetchVehicleById: async (id, options = {}) => prefetchCachedData({
    key: getVehicleKey(id),
    ttl: options.ttl ?? VEHICLE_DETAIL_TTL,
    queryFn: () => fetchVehicleByIdFromApi(id)
  }),

  prefetchCatalogue: async ({ page = 1, limit = 12 } = {}) => Promise.allSettled([
    vehicleService.prefetchVehicles({ page, limit }),
    vehicleService.getCategories(),
    vehicleService.getAgencies()
  ]),

  deleteVehicle: async (id) => {
    const response = await api.delete(`/vehicles/${id}`);
    invalidateCachedData('["vehicles"');
    invalidateCachedData(`["vehicle","${id}"]`);
    return response.data;
  }
};
