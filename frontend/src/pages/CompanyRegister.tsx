import { useState } from "react";
import { registerCompany } from "../services/auth";
import { useNavigate } from "react-router-dom";


function CompanyRegister() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    company_name: "",
    company_code: "",
    email: "",
    phone: "",
    address: "",
  });


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  };


  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    try {

      const response = await registerCompany(form);

      alert(
        `Company registered. Company ID: ${response.id}`
      );

      navigate("/register");

    } catch(error) {

      alert("Company registration failed");

    }

  };


  return (

    <div>

      <h2>Company Registration</h2>


      <form onSubmit={handleSubmit}>


        <input
          name="company_name"
          placeholder="Company Name"
          onChange={handleChange}
        />


        <input
          name="company_code"
          placeholder="Company Code"
          onChange={handleChange}
        />


        <input
          name="email"
          placeholder="Company Email"
          onChange={handleChange}
        />


        <input
          name="phone"
          placeholder="Phone"
          onChange={handleChange}
        />


        <input
          name="address"
          placeholder="Address"
          onChange={handleChange}
        />


        <button>
          Register Company
        </button>


      </form>

    </div>

  );
}


export default CompanyRegister;