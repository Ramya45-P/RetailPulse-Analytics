import axios from "./axios";


export const getAnalyticsDashboard = async(companyId:number)=>{

    const response = await axios.get(
        `/analytics/dashboard?company_id=${companyId}`
    );

    return response.data;

};