const searchForm = document.getElementById('searchForm');
const resultsDiv = document.getElementById('results');
const watchlistDiv = document.getElementById('watchlist');

// load watchlist from server
async function loadWatchlist() {
  try {
    const res = await fetch('/watchlist');
    if (!res.ok) throw new Error('Failed to load watchlist');
    const data = await res.json();

    watchlistDiv.innerHTML = '';
    data.forEach(course => {
      const div = document.createElement('div');
      div.innerHTML = `
        ${course.department}${course.course_number} - ${course.title} 
        (GPA: ${course.average_gpa !== undefined && course.average_gpa !== null ? course.average_gpa.toFixed(2) : 'N/A'})
        <button class="delete-btn">Delete</button>
      `;
      const btn = div.querySelector('.delete-btn');
      btn.addEventListener('click', async () => {
        await fetch(`/watchlist/${course._id}`, { method: 'DELETE' });
        loadWatchlist();
      });
      watchlistDiv.appendChild(div);
    });
  } catch (err) {
    console.error(err);
  }
}

// handle search form submission
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const department = document.getElementById('department').value;
  const className = document.getElementById('className').value;
  const minGPA = document.getElementById('minGPA').value;

  resultsDiv.innerHTML = ''; // ✅ Clear previous results or messages

  try {
    const res = await fetch(`/search?department=${department}&className=${className}&minGPA=${minGPA}`);
    const data = await res.json();

    // if server returns error 
    if (!res.ok || data.length === 0) {
      const errorDiv = document.createElement('div');
      errorDiv.textContent = data.error || 'No courses found matching your criteria in the API';
      resultsDiv.appendChild(errorDiv);
      return; // stop processing further
    }

    // display results if data exists
    data.forEach(course => {
      const div = document.createElement('div');
      div.innerHTML = `
        ${course.department}${course.course_number} - ${course.title} 
        (GPA: ${course.average_gpa !== undefined && course.average_gpa !== null ? course.average_gpa.toFixed(2) : 'N/A'})
        <button>Add to Watchlist</button>
      `;
      const btn = div.querySelector('button');
      btn.addEventListener('click', async () => {
        await fetch('/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(course)
        });
        loadWatchlist();
      });
      resultsDiv.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    // network or fetch error
    const errorDiv = document.createElement('div');
    errorDiv.textContent = 'Failed to fetch courses.';
    resultsDiv.appendChild(errorDiv);
  }
});


// load watchlist on page load
loadWatchlist();
