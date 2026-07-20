<?php include 'includes/head.php'; ?>
<body>
    <?php include 'includes/nav.php'; ?>
    
    <div class="page-wrapper">
        <main class="gallery-standalone">
            <div class="news-header text-center">
                <span class="section-label">GALERIJA</span>
                <h1>Foto utrinki</h1>
                
                <div class="news-filters justify-center">
                    <button class="filter-btn active" data-category="Vse">Vse</button>
                    <button class="filter-btn" data-category="Tekmovanje">Tekmovanje</button>
                    <button class="filter-btn" data-category="Vaje">Vaje</button>
                    <button class="filter-btn" data-category="Prosti čas">Prosti čas</button>
                </div>
            </div>
            
            <div class="gallery-masonry" id="gallery-grid">
                <!-- Photos loaded via JS -->
            </div>
        </main>
        
        <?php include 'includes/sidebar.php'; ?>
    </div>

    <!-- Lightbox -->
    <div id="lightbox" class="lightbox">
        <span class="lightbox-close">&times;</span>
        <button class="lightbox-nav lightbox-prev" id="prev-btn">&#10094;</button>
        <div class="lightbox-content">
            <img src="" id="lightbox-img" class="lightbox-img">
            <div id="lightbox-caption" class="lightbox-caption"></div>
        </div>
        <button class="lightbox-nav lightbox-next" id="next-btn">&#10095;</button>
    </div>

    <?php include 'includes/footer.php'; ?>
    <script src="js/gallery.js"></script>
</body>
</html>
