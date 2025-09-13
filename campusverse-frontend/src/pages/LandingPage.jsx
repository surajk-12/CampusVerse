import { useState, useEffect } from "react";
import { Container, Typography, Button, Grid, Card, CardContent, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
// import axios from "axios";
import api from "../api/axios.js"
import { useNavigate } from "react-router-dom";


const LandingPage = () => {
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const { data } = await api.get("/colleges");
        console.log("Fetched colleges:", data);

        // Make sure data is an array
        if (Array.isArray(data)) {
          setColleges(data);
        } else if (Array.isArray(data.colleges)) {
          setColleges(data.colleges);
        } else {
          setColleges([]); // fallback
        }
      } catch (err) {
        console.error("Failed to fetch colleges", err);
        setColleges([]); // fallback
      }
    };
    fetchColleges();
  }, []);

    const handleCollegeChange = (event) => {
    setSelectedCollege(event.target.value);
    console.log("Selected college id:", event.target.value);
  };


  const handleGetStarted = () => {
    if (!selectedCollege) {
      alert("Please select your college first!");
      return;
    }

    const college = colleges.find(c => c._id === selectedCollege);

    navigate("/register/student", {
      state: {
        college: college._id,
        collegeName: college.collegeName || college.name,
        collegeLocation: college.city || college.location,
      },
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 5 }}>
      {/* Hero Section */}
      <Typography variant="h2" align="center" gutterBottom>
        Welcome to CampusVerse
      </Typography>
      <Typography variant="h6" align="center" color="text.secondary" paragraph>
        A community platform for students to connect, collaborate, and grow together.
      </Typography>

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "15px", marginBottom: "30px" }}>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel>Select College</InputLabel>
          <Select value={selectedCollege} label="Select College" onChange={handleCollegeChange}>
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {Array.isArray(colleges) &&
              colleges.map((college) => (
                <MenuItem key={college._id} value={college._id}>
                  {college.collegeName || college.name} ({college.city || college.location})
                </MenuItem>
              ))
            }

          </Select>
        </FormControl>
        <Button variant="outlined" color="secondary" href="/register">
          Register Your College
        </Button>
      </div>

      {/* Get Started Button */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "50px" }}>
        <Button variant="contained" color="primary" size="large" onClick={handleGetStarted}>
          Get Started
        </Button>
      </div>

      {/* Features Section */}
      <Grid container spacing={3}>
        {[
          { title: "Verified Students", desc: "Only real students with verified college IDs." },
          { title: "Community Feed", desc: "Share posts, ideas, and opportunities." },
          { title: "Connect & Chat", desc: "Message and collaborate with peers." },
        ].map((feature, i) => (
          <Grid item xs={12} sm={4} key={i}>
            <Card sx={{ height: "100%", borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>{feature.title}</Typography>
                <Typography variant="body2" color="text.secondary">{feature.desc}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default LandingPage;
