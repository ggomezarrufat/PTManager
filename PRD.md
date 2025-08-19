Poker Tournament Manager Product Requirements Document (PRD)
Goals and Background Context
Goals
Desarrollar una aplicación web responsive para la gestión de torneos de póker.

Optimizar para uso en smartphones y en tiempo real.

Facilitar el registro de jugadores, control de recompras y cálculo de puntos.

Generar reportes detallados del torneo.

Background Context
El proyecto tiene como objetivo resolver el problema de la gestión ineficiente de torneos de póker, proporcionando una solución integral que abarca desde la creación del torneo hasta la generación de reportes y estadísticas. El enfoque es una aplicación web responsive (PWA) con una arquitectura de frontend-backend (SPA), utilizando Supabase para la base de datos, la autenticación y la sincronización en tiempo real. Este PRD se enfocará en definir los requisitos para la Versión 1.0 del producto.

Change Log
Date	Version	Description	Author
18 de agosto de 2025	1.0	Creación inicial del documento a partir del Project Brief.	John

Exportar a Hojas de cálculo
Requirements
Functional
FR1: El sistema debe permitir la creación de torneos con configuraciones personalizables de ciegas, fichas y límites de recompras.

FR2: Los usuarios deben poder registrarse, iniciar sesión y gestionar sus perfiles.

FR3: El sistema debe tener un reloj de torneo en tiempo real con cuenta regresiva para cada nivel de ciegas, con una interfaz que priorice la claridad y la accesibilidad, incluyendo un modo de pantalla completa y un indicador de conexión para la sincronización en tiempo real.

FR4: El sistema debe permitir el registro de recompras y addons para los jugadores.

FR5: El sistema debe calcular automáticamente los puntos y el ranking de jugadores según los resultados del torneo.

FR6: El sistema debe proporcionar reportes financieros y de estadísticas de los torneos.

FR7: Los administradores deben tener acceso a controles avanzados durante un torneo, como pausar el reloj, adelantar y atrasar niveles, eliminar jugadores y editar el tiempo restante de un nivel.

FR8: El sistema debe mantener los datos sincronizados en tiempo real entre todos los participantes.

FR9: El sistema debe permitir la creación de Temporadas, que tienen una fecha de inicio, una fecha de fin y un nombre de identificación. Los torneos deben pertenecer a una temporada.

FR10: Los usuarios deben poder ver la tabla de puntos por jugador de la temporada actual, además de poder ver los resultados de temporadas pasadas. La tabla debe ordenarse por puntos de mayor a menor y mostrar el sobrenombre del jugador, la cantidad de torneos jugados en la temporada y el total de puntos acumulados en la temporada.

FR11: Los administradores deben poder crear nuevos usuarios, modificar y/o dar de baja usuarios existentes.

FR12: Los administradores deben poder editar los resultados de un torneo finalizado.

Non Functional
NFR1: La aplicación debe ser accesible desde navegadores modernos y en dispositivos móviles con una interfaz responsive.

NFR2: El sistema debe ser seguro con autenticación de usuarios y autorización basada en roles.

NFR3: Las operaciones críticas deben tener un tiempo de respuesta inferior a 1 segundo.

NFR4: El sistema debe ser fiable y proteger contra la pérdida de datos mediante copias de seguridad automáticas.

User Interface Design Goals
Overall UX Vision
La visión de la experiencia de usuario es crear una aplicación móvil primero (mobile-first), intuitiva y fácil de usar, que permita a los administradores y jugadores gestionar torneos de forma fluida y sin fricciones. La interfaz debe ser limpia, enfocada y optimizada para la interacción táctil.

Key Interaction Paradigms
El diseño se centrará en la interacción táctil optimizada, utilizando gestos (swipe gestures), pull-to-refresh y bottom sheets para simplificar las tareas de gestión rápida.

Core Screens and Views
Las pantallas más críticas para entregar el valor del PRD son las siguientes:

"Pantalla de Reloj del Torneo"

"Pantalla de Inicio de Sesión y Registro"

"Panel de Administrador"

"Listado de Torneos"

"Pantalla de Gestión de Jugadores"

"Tabla de Puntos de la Temporada"

"Pantalla de Reportes"

Accessibility: WCAG 2.1 AA
Branding
No se especifican elementos de marca o guías de estilo en el Project Brief.

Target Device and Platforms: Web Responsive
Technical Assumptions
Repository Structure: Monorepo
Service Architecture: Serverless
Testing Requirements: Full Testing Pyramid
Additional Technical Assumptions and Requests
Se utilizará React.js con TypeScript para el frontend, como se indica.

La gestión de estado se realizará con Zustand o Redux Toolkit.

Se implementará la funcionalidad de PWA usando Service Workers.

El backend será Supabase, utilizando su base de datos PostgreSQL, autenticación, APIs y funciones 'Edge'.

El despliegue se realizará en plataformas como Vercel o Netlify.

Se asumirá una estrategia de integración de base de datos que respete el aislamiento de datos con Row Level Security (RLS) para la seguridad de los usuarios.

Epic List
Epic 1: Foundation & Core Infrastructure: Establish project setup, authentication, and basic user management.

Epic 2: Tournament Management & Clock: Implement the creation of tournaments, player management, and the tournament clock.

Epic 3: Points System & Reporting: Implement the logic for seasons, point calculation, and the generation of reports and statistics.

Epic 1: Foundation & Core Infrastructure
Story 1.1: Project Setup & User Authentication
As a developer, I want to set up the React project, integrate Supabase, and establish a basic authentication flow so that users can register, log in, and recover their passwords.

Acceptance Criteria
The React project is configured with TypeScript and Vite.

Supabase integration is complete and functional.

Users can register with email/password and log in.

Password recovery works correctly via email.

Authentication with Google and GitHub is set up.

Local testing is configured and working for authentication logic.

Story 1.2: User Profile Management
As a user, I want to be able to view and edit my profile so I can personalize my information and avatar.

Acceptance Criteria
The user profile displays full name and nickname.

Users can edit their full name and nickname.

Users can upload and update an avatar.

The user's profile displays their tournament history and total accumulated points.

User input validation is implemented to prevent invalid data.

Story 1.3: User Role Management & Route Protection
As a system administrator, I want application routes to be role-protected so that only authorized users can access specific functionalities.

Acceptance Criteria
admin and player roles are created.

New users are assigned the player role by default.

Admin panel routes are only accessible to users with the admin role.

Player panel routes are only accessible to users with the player role.

Unauthorized users are redirected to an "access denied" page or the login page.

Role management is implemented using Supabase's Row Level Security.

Epic 2: Tournament Management & Clock
Story 2.1: Tournament Creation & Configuration
As an administrator, I want to be able to create tournaments with a complete configuration of blinds, chips, rebuy period, addon possibility, and limits, so that I can prepare them properly.

Acceptance Criteria
The administrator can create a new scheduled tournament.

The creation form includes start date and time, blind and break structure, initial chip count, rebuy and addon limits, the last level for rebuys, organizer commission percentage, and payout percentage.

The system validates that the tournament configuration is correct.

The tournament is created with a "Scheduled" status.

When the rebuy level ends, the addon break begins; players can only do an addon during this break.

The administrator can indicate the end of the addon period, at which point registrations close and payouts and prizes are calculated.

The system will offer a standard payout distribution scheme, calculating total funds collected minus the organizer's commission percentage.

This distribution can be manually modified by an administrator as long as the total prize pool remains the same.

Story 2.2: In-Tournament Player Management
As an administrator, I want to be able to register, eliminate, and track players in a tournament to have full control over the participant list.

Acceptance Criteria
The administrator can register players in a tournament.

The administrator can eliminate players from the tournament.

Player elimination automatically records the final position and elimination timestamp.

The player list view shows current chips, status (active/eliminated), and position.

Players can be tracked and sorted by their current position or chip count.

Story 2.3: Tournament Clock & Admin Controls
As an administrator, I want to control the tournament clock so I can manage it live and so players can see accurate information.

Acceptance Criteria
The tournament clock displays a countdown for the current blind level.

Administrators can pause, resume, advance, and go back levels.

The administrator can adjust the remaining time of the current level.

All tournament users can see the clock in real-time.

Clock information includes the current level, remaining time, next level, and average chips.

After the addon period ends and prizes are confirmed, the clock also displays a list of each paid position and the amount they will receive.

Story 2.4: Chip & Purchase System
As an administrator, I want to be able to record rebuys and addons for players to maintain an accurate chip count in the tournament.

Acceptance Criteria
The administrator can record rebuys and addons for players.

The system validates against the maximum rebuy and addon limits configured in the tournament.

Recording a rebuy or addon updates the player's chip count and total paid.

Rebuys and addons are recorded with a timestamp.

Epic 3: Points System & Reporting
Story 3.1: Season Creation & Management
As an administrator, I want to be able to create, name, and define the start and end dates of seasons, so I can categorize tournaments and organize historical data.

Acceptance Criteria
The administrator can create a new season with a name, start date, and end date.

Tournaments can be assigned to a specific season.

The system validates that a tournament's date falls within the season's dates.

The administrator can edit or delete a season.

Story 3.2: Season Points Calculation & Display
As a user, I want to view the player points table for the current season, ordered by total points, so I can easily track player rankings.

Acceptance Criteria
The points table displays the player's nickname, the number of tournaments played in the season, and the total accumulated points.

The table is automatically ordered by total points, from highest to lowest.

Users can view point tables for past seasons' results.

The system automatically calculates points based on tournament results when a tournament is finalized.

Story 3.3: Tournament Result Editing
As an administrator, I want to be able to edit the final results of a completed tournament, so I can correct any errors after the tournament has finished.

Acceptance Criteria
The administrator can access the results of a completed tournament.

The administrator can manually change a player's final position.

The system recalculates points and updates the season's points table after a change is saved.

The system logs any manual changes made to the results.

Story 3.4: Financial & Statistical Reports
As an administrator, I want to view detailed financial and statistical reports for each tournament, so I can analyze performance and revenue.

Acceptance Criteria
The report for a tournament includes total revenue (entries, rebuys, addons) and total prizes distributed.

The report shows statistics like average chips, number of players, and rebuy/addon counts.

The administrator can export reports to a common format like JSON or CSV.