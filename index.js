import express from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import moment from 'moment';
import { add, read, write } from './jsonFileStorage.js';

moment().format();

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: false }));

// obj to sort messages for response
const messages = {
  submitNewError: { message: 'Please fill in all details' },
  submitNew: { message: 'Sighting Submitted' },
  deleted: { message: 'Sighting Deleted' },
  editedError: { message: 'Please fill in all details' },
  edited: { message: 'Sighting Edited' },
};

// boolean to do input validation check, to make sure no fields are empty
const isEmpty = (obj) => Object.values(obj).some((x) => x === null || x === '');

// ###################################### //
// ############# SIGHTINGS LIST ############# //
// ###################################### //

app.get('/', (request, response) => {
  console.log('get: list of sightings');
  let visits = 0;
  if (request.cookies.visits) {
    visits = Number(request.cookies.visits); // get the value from the request
  }
  read('data.json', (err, jsonData) => {
    if (err) {
      response.status(500).send('Read Error');
      return;
    }
    for (let i = 0; i < jsonData.sightings.length; i += 1) {
      jsonData.sightings[i].index = `${i}`;
    }
    const selectedSort = request.query.sortby;
    console.log('sort by: ', request.query.sortby);
    if (selectedSort === 'date') {
      jsonData.sightings.sort((a, b) => ((a.date_time > b.date_time) ? 1 : -1));
    }
    if (selectedSort === 'state') {
      jsonData.sightings.sort((a, b) => ((a.state > b.state) ? 1 : -1));
    }
    if (selectedSort === 'shape') {
      jsonData.sightings.sort((a, b) => ((a.shape > b.shape) ? 1 : -1));
    }
    visits += 1;
    jsonData.visits = visits;
    for (let i = 0; i < jsonData.sightings.length; i += 1) {
      jsonData.sightings[i].date_time = moment(jsonData.sightings[i].date_time).format('MMMM Do YYYY');
    }
    response.cookie('visits', visits);
    response.render('indexPage', jsonData);
  });
});

// ###################################### //
// ############# SINGLE SIGHT PAGE ############# //
// ###################################### //

app.get('/sighting/:index', (request, response) => {
  console.log('get: single sighting page');
  read('data.json', (err, jsonData) => {
    if (err) {
      response.status(500).send('Read Error');
      return;
    }
    const contentJson = jsonData.sightings[request.params.index];
    // contentJson.date_time = moment(contentJson.date_time, moment.defaultFormat).toDate();
    contentJson.date_time = moment(contentJson.date_time).format('dddd, MMMM Do YYYY');
    contentJson.createdX = moment(contentJson.created).fromNow();
    response.render('sightPage', contentJson);
  });
});

// ###################################### //
// ############# SUBMIT NEW ############# //
// ###################################### //

app.post('/sighting', (request, response) => {
  console.log('post: sighting submitted');
  const createdDate = Date();
  request.body.created = createdDate;
  console.log(request.body);
  console.log('any item not filled?', isEmpty(request.body));
  if (!isEmpty(request.body)) {
    add('data.json', 'sightings', request.body, (err) => {
      if (err) {
        response.status(500).send('DB write error.');
        return;
      }
      response.render('message', messages.submitNew);
    });
  } else {
    response.render('message', messages.submitNewError);
  }
});

app.get('/sighting', (request, response) => {
  console.log('get: form to submit');
  response.render('submitForm');
});

// ###################################### //
// ############# EDIT      ############# //
// ###################################### //

app.get('/sighting/:index/edit', (request, response) => {
  // Retrieve current sighting data and render it
  console.log('get: form to edit');
  read('data.json', (err, jsonData) => {
    const { index } = request.params;
    const sighting = jsonData.sightings[index];
    // Pass the sighting index to the edit form for the PUT request URL.
    sighting.index = index;
    const ejsData = { sighting };
    response.render('edit', ejsData);
  });
});

app.put('/sighting/:index', (request, response) => {
  console.log('put: edit sighting');
  const { index } = request.params;
  console.log('any item not filled?', isEmpty(request.body));
  if (!isEmpty(request.body)) {
    read('data.json', (err, data) => {
    // Replace the data in the object at the given index
      data.sightings[index] = request.body;
      write('data.json', data, (err) => {
        response.render('message', messages.edited);
      });
    }); } else {
    response.render('message', messages.editedError);
  }
});

// ###################################### //
// ############# DELETE     ############# //
// ###################################### //

app.delete('/sighting/:index', (request, response) => {
  console.log('delete: remove sighting');
  // Remove element from DB at given index
  const { index } = request.params;
  read('data.json', (err, jsonData) => {
    jsonData.sightings.splice(index, 1);
    write('data.json', jsonData, (err) => {
      response.render('message', messages.deleted);
    });
  });
});

app.get('/sighting/:index/delete', (request, response) => {
  // Retrieve current recipe data and render it
  read('data.json', (err, jsonData) => {
    const { index } = request.params;
    const sighting = jsonData.sightings[index];
    sighting.index = index;
    const ejsData = { sighting };
    response.render('delete', ejsData);
  });
});

// ###################################### //
// ############# SHAPES    ############# //
// ###################################### //

app.get('/shapes', (request, response) => {
  console.log('get: page for list of shapes');
  read('data.json', (err, jsonData) => {
    const { sightings } = jsonData;
    const shapesTally = {};
    for (let i = 0; i < sightings.length; i += 1) {
      const { shape } = sightings[i];
      if (shape in shapesTally) {
        shapesTally[shape] += 1;
      } else { shapesTally[shape] = 1; }
    }
    const ejsData = { shapes: shapesTally };
    console.log(ejsData);
    response.render('shapesPage', ejsData);
  });
});

app.get('/shapes/:shape', (request, response) => {
  console.log('get: listing with certain shape');
  read('data.json', (err, jsonData) => {
    const { shape } = request.params;
    const { sightings } = jsonData;
    for (let i = 0; i < jsonData.sightings.length; i += 1) {
      jsonData.sightings[i].index = `${i}`;
    }
    const arrayOfSameShape = [];
    for (let i = 0; i < sightings.length; i += 1) {
      if (sightings[i].shape === `${shape}`) {
        arrayOfSameShape.push(sightings[i]);
      }
    }
    const ejsData = {
      requestedShape: shape,
      sightings: arrayOfSameShape,
    };
    for (let i = 0; i < ejsData.sightings.length; i += 1) {
      ejsData.sightings[i].date_time = moment(ejsData.sightings[i].date_time).format('MMMM Do YYYY');
    }
    response.render('sameShapePage', ejsData);
  });
});

app.listen(3004);
