export interface User {
  id: number;
  orgId: number;
  orgName?: string | null;
  sbuId?: number | null;
  campaignId?: number | null;
  username: string;
  email?: string | null;
  mobile?: string | null;
  address?: string | null;
  pincode?: number | null;
  roleId?: number | null;
  status: boolean;
  createdOn?: string;
}

export interface SubscriptionDetails {
  id: number;
  planId: number;
  startDate?: string | null;
  endDate?: string | null;
  noOfDaysPending: string;
  isActive: boolean;
  planMaster?: {
    id: number;
    name: string;
    validity: string;
    price: number;
    description?: string | null;
  };
}

export interface AuthResponseData {
  accessToken?: string;
  user: User;
  menus: string[];
  subscription: boolean;
  subscriptionDetails?: SubscriptionDetails | null;
}

export interface Campaign {
  id: number;
  orgId: number;
  campaignName: string;
  campaignTypeId: number;
  description?: string | null;
  fromDate: string;
  toDate: string;
  stateId: number;
  districtId: number;
  location?: string | null;
  campaignObjective?: string | null;
  createdBy?: string | null;
  createdOn?: string;
  status: boolean;
}

export interface VisitorDetail {
  id?: number;
  visitorName?: string | null;
  email?: string | null;
  mobileNo?: string | null;
}

export interface VisitorIntProduct {
  id?: number;
  productFamilyId?: number | null;
  productId?: number | null;
  noOfMachines?: number | null;
}

export interface Visitor {
  id: number;
  orgId: number;
  sbuId?: number | null;
  campaignId: number;
  industryTypeId: number;
  userId: number;
  companyType?: number | null;
  companyName?: string | null;
  address?: string | null;
  stateId: number;
  districtId: number;
  pincode?: number | null;
  planningTimeline?: string | null;
  financingReuired?: boolean | null;
  noOfPeopleAccompanied?: number | null;
  noOfGifts?: string | null;
  giftDetails?: string | null;
  createdBy?: string | null;
  createdOn?: string;
  status: boolean;
  visitorDetails?: VisitorDetail[];
  productsInterested?: VisitorIntProduct[];
}

export interface ProductFamily {
  id: number;
  orgId: number;
  sbuId?: number | null;
  productFamilyName: string;
  productFamilyDescription?: string | null;
  status: boolean;
}

export interface ProductModel {
  id?: number;
  modelName?: string | null;
}

export interface Product {
  id: number;
  orgId: number;
  sbuId: number;
  productFamilyId: number;
  productCode: string;
  productName: string;
  productDescription?: string | null;
  status: boolean;
  model?: ProductModel[];
}

export interface StateItem {
  id: number;
  name: string;
}

export interface DistrictItem {
  id: number;
  stateId: number;
  name: string;
}

export interface CampaignType {
  id: number;
  camapignType: string;
  campaignTypeDescription?: string | null;
}

export interface IndustryType {
  id: number;
  industryType: string;
  industryTypeDescription?: string | null;
}

export interface CompanyType {
  id: number;
  companyType: string;
}

export interface RoleItem {
  id: number;
  orgId: number;
  roleName: string;
  roleDescription?: string | null;
}

export interface SbuItem {
  id: number;
  orgId: number;
  sbuName: string;
  sbuDescription?: string | null;
}

export type PageKey =
  | 'dashboard'
  | 'campaigns'
  | 'visitors'
  | 'products'
  | 'users';
