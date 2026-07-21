import axios from "axios";

const API_URL = "http://127.0.0.1:8000";


export interface CompanyData {
  company_name: string;
  company_code: string;
  email: string;
  phone: string;
  address: string;
}


export const registerCompany = async (
  data: CompanyData
) => {
  const response = await axios.post(
    `${API_URL}/companies/`,
    data
  );

  return response.data;
};

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  company_id: number;
}

export const registerUser = async (data: RegisterData) => {
  const response = await axios.post(
    `${API_URL}/auth/register`,
    data
  );

  return response.data;
};


export const loginUser = async (
  email: string,
  password: string
) => {

  const formData = new URLSearchParams();

  formData.append("username", email);
  formData.append("password", password);


  const response = await axios.post(
    `${API_URL}/auth/login`,
    formData,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );


  localStorage.setItem(
    "access_token",
    response.data.access_token
  );


  return response.data;
};