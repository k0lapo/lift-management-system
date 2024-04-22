document.addEventListener('DOMContentLoaded', function () {
  const elevators = document.querySelectorAll('.elevator');
  const displays = document.querySelectorAll('.elevator-display');
  const floorButtons = document.querySelectorAll('.floor-btn');
  const roundContainers = document.querySelectorAll('.round');

  const elevatorStates = [];

  // Initialize elevator states
  for (let i = 0; i < elevators.length; i++) {
    elevatorStates.push({
      currentFloor: 0,
      isMoving: false,
      requestQueue: [],
      requests: [],
      elevator: elevators[i],
      display: displays[i],
      roundContainer: roundContainers[i],
    });
  }

  // Function to open elevator door
  function openDoor(elevator) {
    elevator.querySelector('.elevator-door').style.width = '50px';
    const elevatorState = elevatorStates.find(
      (state) => state.elevator === elevator
    );
    if (elevatorState) {
      elevatorState.roundContainer.style.visibility = 'visible';
    }
  }

  // Function to close elevator door
  function closeDoor(elevator) {
    elevator.querySelector('.elevator-door').style.width = '0';
  }

  // Function to move elevator to target floor
  function moveElevator(elevatorState, targetFloor) {
    // Check if there are requests
    if (
      elevatorState.requests.length === 0 &&
      elevatorState.requestQueue.length === 0
    ) {
      elevatorState.isMoving = false;
      console.log(
        `Elevator ${elevatorState.elevator.id} stopped, no outstanding requests`
      );
      elevatorState.roundContainer.style.visibility = 'visible';
      return;
    }

    // Check if the target floor is reached
    if (elevatorState.currentFloor === targetFloor) {
      processRequests(elevatorState);
      return;
    }

    // Move the elevator to the target floor
    elevatorState.isMoving = true;
    const floorHeight = -80;
    const targetPosition = targetFloor * floorHeight;

    let timeout = 3000;
    const moveDirection = targetFloor > elevatorState.currentFloor ? 1 : -1;

    for (
      let floor = elevatorState.currentFloor;
      floor !== targetFloor;
      floor += moveDirection
    ) {
      setTimeout(() => {
        checkForRequests(elevatorState, floor);
        elevatorState.elevator.style.transform = `translateY(${
          floor * floorHeight
        }px)`;
        elevatorState.currentFloor = floor;
        elevatorState.display.textContent = elevatorState.currentFloor;

        // Open the door if there's a request on this floor
        if (
          elevatorState.requests.includes(floor) ||
          elevatorState.requestQueue.includes(floor)
        ) {
          openDoor(elevatorState.elevator);
          elevatorState.roundContainer.style.visibility = 'visible';
        } else {
          closeDoor(elevatorState.elevator);
          elevatorState.roundContainer.style.visibility = 'hidden';
        }
      }, timeout);

      timeout += 3000;
    }

    setTimeout(() => {
      // After reaching the target floor
      elevatorState.elevator.style.transform = `translateY(${targetPosition}px)`;
      elevatorState.currentFloor = targetFloor;
      elevatorState.display.textContent = elevatorState.currentFloor;

      // Open the door if there's a request on this floor
      if (
        elevatorState.requests.includes(targetFloor) ||
        elevatorState.requestQueue.includes(targetFloor)
      ) {
        openDoor(elevatorState.elevator);
        elevatorState.roundContainer.style.visibility = 'visible';
      } else {
        closeDoor(elevatorState.elevator);
        elevatorState.roundContainer.style.visibility = 'hidden';
      }

      // Remove red-bg class from elevator button
      const elevatorButton = elevatorState.roundContainer.querySelector(
        `.ele-btn[data-floor="${targetFloor}"]`
      );
      if (elevatorButton) {
        elevatorButton.classList.remove('red-bg');
      }

      // Remove red-bg class from all floor buttons corresponding to the target floor
      floorButtons.forEach((button) => {
        if (parseInt(button.dataset.floor) === targetFloor) {
          button.classList.remove('red-bg');
        }
      });

      setTimeout(() => {
        // Close the door after a delay
        openDoor(elevatorState.elevator);
        elevatorState.isMoving = false;
        if (elevatorState.requestQueue.length > 0) {
          const nextRequest = elevatorState.requestQueue.shift();
          moveElevator(elevatorState, nextRequest);
        } else {
          processRequests(elevatorState);
        }

        // Remove processed request from arrays
        elevatorState.requests = elevatorState.requests.filter(
          (request) => request !== targetFloor
        );
        elevatorState.requestQueue = elevatorState.requestQueue.filter(
          (request) => request !== targetFloor
        );
      }, 10000);
    }, timeout);
  }

  // Function to request elevator for target floors
  function requestElevator(targetFloors) {
    // Calculate distances for each elevator to the target floors
    const distances = elevatorStates.map((state) =>
      targetFloors.map((floor) => Math.abs(floor - state.currentFloor))
    );

    // Find the elevator with the minimum total distance
    let closestElevatorIndex = 0;
    let minDistance = Number.MAX_VALUE;

    for (let i = 0; i < distances.length; i++) {
      const totalDistance = distances[i].reduce(
        (acc, distance) => acc + distance,
        0
      );
      if (totalDistance < minDistance) {
        minDistance = totalDistance;
        closestElevatorIndex = i;
      }
    }

    // Request elevator for the closest elevator
    requestElevatorForElevator(
      elevatorStates[closestElevatorIndex],
      targetFloors
    );
  }

  // Function to request elevator for specific elevator
  function requestElevatorForElevator(elevatorState, targetFloors) {
    if (elevatorState.isMoving) {
      elevatorState.requestQueue.push(...targetFloors);
    } else {
      targetFloors.forEach((targetFloor) => {
        if (!elevatorState.requests.includes(targetFloor)) {
          elevatorState.requests.push(targetFloor);
        }
      });

      targetFloors.forEach((targetFloor) => {
        checkForRequests(elevatorState, targetFloor);
      });

      openDoor(elevatorState.elevator);
      elevatorState.requestQueue.push(...targetFloors);

      setTimeout(() => {
        openDoor(elevatorState.elevator);
        processRequests(elevatorState);
      }, 5000);
    }
  }

  // Function to process elevator requests
  function processRequests(elevatorState) {
    if (elevatorState.isMoving || elevatorState.requestQueue.length === 0) {
      return;
    }

    // Calculate distance of each request from current floor of the elevator
    const distances = elevatorState.requestQueue.map((request) =>
      Math.abs(request - elevatorState.currentFloor)
    );

    // Create an array of indices to sort based on distances
    const indices = Array.from(Array(elevatorState.requestQueue.length).keys());

    // Sort indices array based on distances
    indices.sort((a, b) => distances[a] - distances[b]);

    // Rearrange requestQueue based on sorted indices
    elevatorState.requestQueue = indices.map(
      (index) => elevatorState.requestQueue[index]
    );

    // Move to next request
    const nextRequest = elevatorState.requestQueue.shift();
    moveElevator(elevatorState, nextRequest);

    // Remove processed request from requests or requestQueue
    if (elevatorState.requests.includes(nextRequest)) {
      elevatorState.requests = elevatorState.requests.filter(
        (request) => request !== nextRequest
      );
    } else {
      elevatorState.requestQueue = elevatorState.requestQueue.filter(
        (request) => request !== nextRequest
      );
    }

    // If there are no more requests, stop the elevator
    if (
      elevatorState.requestQueue.length === 0 &&
      elevatorState.requests.length === 0
    ) {
      setTimeout(() => {
        elevatorState.isMoving = false;
        console.log(
          `Elevator ${elevatorState.elevator.id} stopped, no outstanding requests`
        );
        elevatorState.roundContainer.style.visibility = 'visible';
      });
    }
  }

  // Function to handle new requests
  function checkForRequests(elevatorState, floor) {
    console.log(`Checking for requests on floor ${floor}`);
    if (elevatorState.requests.includes(floor)) {
      console.log(`Request detected at floor ${floor}`);
      elevatorState.requestQueue.push(floor);
    } else {
      console.log(`No request at floor ${floor}`);
    }
  }

  // Event listener for floor buttons
  floorButtons.forEach((button) => {
    button.addEventListener('click', function () {
      const targetFloor = parseInt(button.dataset.floor);
      requestElevator([targetFloor]);
      button.classList.add('red-bg');
    });
  });

  // Event listener for elevator buttons inside round containers
  roundContainers.forEach((roundContainer, index) => {
    const eleButtons = roundContainer.querySelectorAll('.ele-btn');
    eleButtons.forEach((button) => {
      button.addEventListener('click', function () {
        const targetFloor = parseInt(button.dataset.floor);
        requestElevatorForElevator(elevatorStates[index], [targetFloor]);
        button.classList.add('red-bg');
      });
    });
  });

  // Event listener for new requests
  document.addEventListener('newRequest', function (event) {
    const targetFloors = event.detail.targetFloors;
    requestElevator(targetFloors);
  });

  // Open all elevator doors on page load
  elevators.forEach((elevator) => {
    openDoor(elevator);
  });
});
