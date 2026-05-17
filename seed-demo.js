/**
 * Demo Data Seed Script
 * Run: node seed-demo.js
 * 
 * Adds employees, projects, tasks, and assignments for demo showcase.
 */

const BASE_URL = 'http://localhost:5000/api'

// Your admin token - login first and paste token here
let ADMIN_TOKEN = ''

async function api(method, path, body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
    },
  }
  if (body) opts.body = JSON.stringify(body)
  
  const res = await fetch(`${BASE_URL}${path}`, opts)
  const data = await res.json()
  
  if (!res.ok) {
    console.error(`❌ ${method} ${path}: ${data.error || JSON.stringify(data)}`)
    return null
  }
  return data
}

async function login() {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'shivani@test.com', password: 'test123' }),
  })
  const data = await res.json()
  if (data.token) {
    ADMIN_TOKEN = data.token
    console.log('✅ Logged in as admin')
    return true
  }
  console.error('❌ Login failed:', data)
  return false
}

async function registerEmployee(firstName, lastName, email, password, role) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastName, email, password, role }),
  })
  const data = await res.json()
  if (data.user) {
    console.log(`✅ Registered: ${firstName} ${lastName} (${role})`)
    return data.user
  }
  // If already exists, try to get from employees list
  if (data.error?.includes('already registered')) {
    console.log(`⏭️  Already exists: ${email}`)
    return null
  }
  console.error(`❌ Register ${email}:`, data.error)
  return null
}

async function createProject(projectName, clientName, description, startDate, endDate, status) {
  const data = await api('POST', '/projects', {
    projectName, clientName, description, startDate, endDate, status,
  })
  if (data) {
    console.log(`✅ Created project: ${projectName}`)
    return data
  }
  return null
}

async function createTask(projectId, taskName, description, dueDate, status, priority) {
  const data = await api('POST', '/tasks', {
    projectId, taskName, description, dueDate, status, priority,
  })
  if (data) {
    console.log(`✅ Created task: ${taskName}`)
    return data
  }
  return null
}

async function assignEmployee(employeeId, projectId, roleInProject) {
  const data = await api('POST', '/assignments', {
    employeeId, projectId, roleInProject,
  })
  if (data) {
    console.log(`✅ Assigned employee ${employeeId} to project ${projectId} as ${roleInProject}`)
    return data
  }
  return null
}

async function getEmployees() {
  return await api('GET', '/employees')
}

async function getProjects() {
  return await api('GET', '/projects')
}

async function main() {
  console.log('\n🚀 Echelon Demo Data Seeder\n')

  // Step 1: Login
  const loggedIn = await login()
  if (!loggedIn) return

  // Step 2: Register Employees
  console.log('\n📋 Registering Employees...\n')
  
  const employees = [
    { firstName: 'James', lastName: 'Anderson', email: 'james@echelon.io', password: 'Demo123!', role: 'Manager' },
    { firstName: 'Sarah', lastName: 'Mitchell', email: 'sarah@echelon.io', password: 'Demo123!', role: 'Manager' },
    { firstName: 'Michael', lastName: 'Clark', email: 'michael@echelon.io', password: 'Demo123!', role: 'Staff' },
    { firstName: 'Emily', lastName: 'Roberts', email: 'emily@echelon.io', password: 'Demo123!', role: 'Staff' },
    { firstName: 'David', lastName: 'Thompson', email: 'david@echelon.io', password: 'Demo123!', role: 'Staff' },
    { firstName: 'Jessica', lastName: 'Wagner', email: 'jessica@echelon.io', password: 'Demo123!', role: 'Staff' },
  ]

  const registeredEmployees = []
  for (const emp of employees) {
    const user = await registerEmployee(emp.firstName, emp.lastName, emp.email, emp.password, emp.role)
    if (user) registeredEmployees.push(user)
  }

  // Get all employees (including existing ones)
  const allEmployees = await getEmployees()
  console.log(`\n📊 Total employees: ${allEmployees?.length || 0}`)

  // Find employee IDs
  const james = allEmployees?.find(e => e.Email === 'james@echelon.io')
  const sarah = allEmployees?.find(e => e.Email === 'sarah@echelon.io')
  const michael = allEmployees?.find(e => e.Email === 'michael@echelon.io')
  const emily = allEmployees?.find(e => e.Email === 'emily@echelon.io')
  const david = allEmployees?.find(e => e.Email === 'david@echelon.io')
  const jessica = allEmployees?.find(e => e.Email === 'jessica@echelon.io')

  // Step 3: Create Projects
  console.log('\n📁 Creating Projects...\n')

  const project1 = await createProject(
    'Medusa E-Commerce Platform',
    'ShopEase Inc',
    'Full-featured e-commerce platform with product catalog, shopping cart, payment integration, and order management.',
    '2026-01-15',
    '2026-07-15',
    'In Progress'
  )

  const project2 = await createProject(
    'Mobile Shopping App',
    'ShopEase Inc',
    'React Native mobile application for iOS and Android with product browsing, cart, and checkout.',
    '2026-03-01',
    '2026-09-30',
    'In Progress'
  )

  const project3 = await createProject(
    'Admin Dashboard & Analytics',
    'ShopEase Inc',
    'Internal admin dashboard for managing products, orders, customers, and viewing analytics.',
    '2026-05-01',
    '2026-10-31',
    'Planning'
  )

  // Get all projects
  const allProjects = await getProjects()
  console.log(`\n📊 Total projects: ${allProjects?.length || 0}`)

  // Find project IDs
  const medusa = allProjects?.find(p => p.ProjectName === 'Medusa E-Commerce Platform')
  const mobile = allProjects?.find(p => p.ProjectName === 'Mobile Shopping App')
  const admin = allProjects?.find(p => p.ProjectName === 'Admin Dashboard & Analytics')

  // Step 4: Create Tasks for Medusa
  if (medusa) {
    console.log('\n📝 Creating Tasks for Medusa...\n')
    
    await createTask(medusa.ProjectID, 'Setup product catalog module', 'Configure product models, categories, and attributes', '2026-02-15', 'Completed', 'High')
    await createTask(medusa.ProjectID, 'Implement shopping cart API', 'Build cart endpoints with add, update, remove, and checkout', '2026-03-10', 'Completed', 'High')
    await createTask(medusa.ProjectID, 'Design checkout flow UI', 'Create wireframes and implement checkout pages', '2026-04-20', 'In Progress', 'High')
    await createTask(medusa.ProjectID, 'Integrate Stripe payment gateway', 'Setup Stripe SDK and implement payment processing', '2026-05-15', 'Pending', 'High')
    await createTask(medusa.ProjectID, 'Build order management dashboard', 'Create admin panel for order tracking and management', '2026-06-10', 'Pending', 'Medium')
    await createTask(medusa.ProjectID, 'Implement inventory tracking', 'Real-time stock management and low-stock alerts', '2026-06-30', 'In Progress', 'Medium')
    await createTask(medusa.ProjectID, 'Write unit tests for cart module', 'Achieve 80% test coverage for cart functionality', '2026-07-01', 'Pending', 'Medium')
    await createTask(medusa.ProjectID, 'Deploy to staging environment', 'Setup CI/CD pipeline and deploy to Azure staging', '2026-07-05', 'Pending', 'Low')
    await createTask(medusa.ProjectID, 'Performance optimization', 'Optimize database queries and implement caching', '2026-07-10', 'Pending', 'Low')
    await createTask(medusa.ProjectID, 'Security audit and fixes', 'Run security scan and fix vulnerabilities', '2026-07-14', 'Pending', 'High')
  }

  // Step 5: Create Tasks for Mobile App
  if (mobile) {
    console.log('\n📝 Creating Tasks for Mobile App...\n')
    
    await createTask(mobile.ProjectID, 'Setup React Native project', 'Initialize project with Expo and configure navigation', '2026-03-15', 'Completed', 'High')
    await createTask(mobile.ProjectID, 'Design mobile UI screens', 'Create Figma designs for all app screens', '2026-04-30', 'In Progress', 'High')
    await createTask(mobile.ProjectID, 'Implement product browsing', 'Build product list, search, and detail screens', '2026-05-30', 'Pending', 'Medium')
    await createTask(mobile.ProjectID, 'Add push notifications', 'Setup Firebase and implement push notifications', '2026-07-15', 'Pending', 'Low')
    await createTask(mobile.ProjectID, 'App store submission', 'Prepare assets and submit to App Store and Play Store', '2026-09-15', 'Pending', 'High')
  }

  // Step 6: Create Tasks for Admin Dashboard
  if (admin) {
    console.log('\n📝 Creating Tasks for Admin Dashboard...\n')
    
    await createTask(admin.ProjectID, 'Design analytics dashboard', 'Create wireframes for charts and KPI widgets', '2026-06-15', 'Pending', 'High')
    await createTask(admin.ProjectID, 'Build reporting module', 'Implement exportable reports for sales and inventory', '2026-08-30', 'Pending', 'Medium')
    await createTask(admin.ProjectID, 'User role management', 'Add RBAC with permission controls', '2026-10-15', 'Pending', 'High')
  }

  // Step 7: Assign Employees to Projects
  console.log('\n👥 Assigning Employees to Projects...\n')

  if (james && medusa) await assignEmployee(james.EmployeeID, medusa.ProjectID, 'Project Lead')
  if (michael && medusa) await assignEmployee(michael.EmployeeID, medusa.ProjectID, 'Developer')
  if (emily && medusa) await assignEmployee(emily.EmployeeID, medusa.ProjectID, 'Developer')

  if (sarah && mobile) await assignEmployee(sarah.EmployeeID, mobile.ProjectID, 'Project Lead')
  if (david && mobile) await assignEmployee(david.EmployeeID, mobile.ProjectID, 'Developer')

  if (james && admin) await assignEmployee(james.EmployeeID, admin.ProjectID, 'Project Lead')
  if (jessica && admin) await assignEmployee(jessica.EmployeeID, admin.ProjectID, 'Developer')

  console.log('\n✨ Demo data seeding complete!')
  console.log('\n📊 Summary:')
  console.log(`   Employees: ${allEmployees?.length || 0}`)
  console.log(`   Projects: ${allProjects?.length || 0}`)
  console.log(`   Tasks: 18`)
  console.log(`   Assignments: 7`)
}

main().catch(console.error)
