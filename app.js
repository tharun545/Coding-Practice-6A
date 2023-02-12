const express = require("express");

const app = express();

app.use(express.json());

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const path = require("path");

let db = null;

const dbPath = path.join(__dirname, "covid19India.db");

const startDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  } catch (e) {
    process.exit(1);
  }
};

app.listen(3000, () => {
  console.log("Server Stated at http://localhost:3000");
});

startDBAndServer();

const convertDBObjectToResponseObjectOfState = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDBObjectToResponseObjectOfDistrict = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//API 1 GET Method of State DB
app.get("/states/", async (request, response) => {
  const stateQuery = `
        SELECT * FROM state;
    `;
  const stateResult = await db.all(stateQuery);
  response.send(
    stateResult.map((each) => convertDBObjectToResponseObjectOfState(each))
  );
});

//API 2 GET Method from unique State ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const getResult = await db.get(getQuery);
  response.send(convertDBObjectToResponseObjectOfState(getResult));
});

//API 3 POST Method of State
app.post("/districts/", async (request, response) => {
  const queryDetails = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = queryDetails;
  const addQuery = `INSERT INTO district (
        district_name,
        state_id,
        cases,
        cured,
        active,
        deaths
    ) 
  VALUES 
        ('${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
  );`;
  await db.run(addQuery);
  response.send("District Successfully Added");
});

//API 4 GET Method of Districts
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT * FROM district WHERE district_id = ${districtId};`;
  const getUniqueQuery = await db.all(getDistrictQuery);
  //   response.send(convertDBObjectToResponseObjectOfDistrict(getUniqueQuery));
  response.send(
    getUniqueQuery.map((each) =>
      convertDBObjectToResponseObjectOfDistrict(each)
    )
  );
});

//API 5 DELETE Method of District
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    DELETE FROM district 
    WHERE district_id = ${districtId};`;
  await db.run(deleteQuery);
  response.send("District Removed");
});

//API 6 PUT Method of District
app.put("/districts/:districtId/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
    UPDATE district 
    SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths};
  `;
  response.send("District Details Updated");
});

//API 7 GET Method
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getQuery = `
    SELECT cases as testCases,
            cured as totalCured,
            active as totalActive,
            deaths as totalDeaths
        FROM district WHERE state_id = ${stateId};
    `;
  const getResult = await db.all(getQuery);
  response.send(getResult);
});

// API 8 GET Method of District
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getUniqueDistrict = `
        SELECT state_name FROM state INNER JOIN district 
        WHERE district_id = ${districtId};
    `;
  const finalResult = await db.get(getUniqueDistrict);
  response.send(finalResult);
});

module.exports = app;
