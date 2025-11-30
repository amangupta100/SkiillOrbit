const axios = require("axios");

const getPlaces = async (req, res) => {
  try {
    const query = req.query.q;

    const response = await axios.get(
      `https://www.eatsure.com/v1/api/autocomplete?places=${encodeURIComponent(
        query
      )}`
    );

    res.json(response.data); // send same data to frontend
  } catch (error) {
    res.status(500).json({ message: "Error fetching places" });
  }
};

const companiesName = async (req, res) => {
  try {
    const query = req.query.q;

    const response = await axios.get(
      `https://autocomplete.indeed.com/api/v0/suggestions/company?country=IN&language=en&count=6&formatted=1&query=${encodeURIComponent(
        query
      )}&useEachWord=true&showAlternateSuggestions=false&rich=true`
    );

    res.json(response.data); // send same data to frontend
  } catch (error) {
    res.status(500).json({ message: "Error fetching places" });
  }
};

module.exports = {
  getPlaces,
  companiesName,
};
