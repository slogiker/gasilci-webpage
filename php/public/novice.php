<?php include 'includes/head.php'; ?>
<body>
    <?php include 'includes/nav.php'; ?>
    
    <div class="page-wrapper">
        <div class="news-container">
            <aside class="news-sidebar">
                <h3>Vse novice</h3>
                <ul id="news-headlines" class="headlines-list">
                    <!-- Headlines loaded via JS -->
                </ul>
            </aside>
            
            <main class="news-main">
                <div class="news-header">
                    <span class="section-label">NOVICE</span>
                    <h1>Novice in dogodki</h1>
                    
                    <div class="news-filters">
                        <button class="filter-btn active" data-category="Vse">Vse</button>
                        <button class="filter-btn" data-category="Vaje">Vaje</button>
                        <button class="filter-btn" data-category="Tekmovanje">Tekmovanje</button>
                        <button class="filter-btn" data-category="Organizacija">Organizacija</button>
                    </div>
                </div>
                
                <div class="news-grid-standalone" id="news-grid-standalone">
                    <!-- News cards loaded via JS -->
                </div>
            </main>
        </div>
        
        <?php include 'includes/sidebar.php'; ?>
    </div>

    <!-- News Modal (reused from index) -->
    <div id="news-modal" class="modal-overlay">
        <div class="modal-content">
            <span class="modal-close">&times;</span>
            <div id="modal-body">
                <!-- Loaded via JS -->
            </div>
        </div>
    </div>

    <?php include 'includes/footer.php'; ?>
    <script src="js/news.js"></script>
</body>
</html>
