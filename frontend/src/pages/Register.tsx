import { useState } from "react";
import { registerUser } from "../services/auth";
import { useNavigate } from "react-router-dom";


function Register() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    company_id: 1,
  });


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    setForm({
      ...form,
      [e.target.name]:
        e.target.name === "company_id"
          ? Number(e.target.value)
          : e.target.value
    });

  };


  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    try {

      await registerUser(form);

      alert("Registration successful");

      navigate("/login");

    } catch(error) {

      alert("Registration failed");

    }

  };


  return (

    <div>

      <h2>Register</h2>


      <form onSubmit={handleSubmit}>


        <input
          name="full_name"
          placeholder="Full Name"
          onChange={handleChange}
        />


        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
        />


        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
        />


        <input
          name="company_id"
          type="number"
          placeholder="Company ID"
          onChange={handleChange}
        />


        <button>
          Register
        </button>


      </form>

    </div>

  );
}

export default Register;