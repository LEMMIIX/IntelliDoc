# cluster.py
import hdbscan
import numpy as np
import json
import sys
from scipy.spatial.distance import pdist, squareform
from time import perf_counter
from dataclasses import dataclass
from typing import List, Tuple, Optional, Dict

@dataclass
class ClusteringConfig:
    min_cluster_size: int = 3
    min_samples: int = 2
    cluster_selection_method: str = 'eom'
    cluster_selection_epsilon: float = 0.0
    metric: str = 'euclidean'
    algorithm: str = 'best'
    core_dist_n_jobs: int = -1

@dataclass
class ClusteringStats:
    avg_distance: float
    min_distance: float
    max_distance: float
    closest_pairs: Optional[List[Tuple[int, int]]] = None
    processing_time: float = 0.0
    n_clusters: int = 0
    n_noise: int = 0
    cluster_sizes: Optional[List[int]] = None

class DocumentClusterer:
    def __init__(self, config: ClusteringConfig = None):
        self.config = config or ClusteringConfig()
        
    def analyze_embeddings(self, embeddings_array: np.ndarray) -> ClusteringStats:
        distances = pdist(embeddings_array, metric=self.config.metric)
        
        stats = ClusteringStats(
            avg_distance=float(np.mean(distances)),
            min_distance=float(np.min(distances)),
            max_distance=float(np.max(distances))
        )
        
        if stats.min_distance < 0.1:
            distance_matrix = squareform(distances)
            min_indices = np.where(distance_matrix == stats.min_distance)
            stats.closest_pairs = [(int(i), int(j)) for i, j in zip(*min_indices) if i < j]
        
        return stats
    
    def perform_clustering(self, embeddings_array: np.ndarray) -> Tuple[np.ndarray, ClusteringStats]:
        start_time = perf_counter()
        
        # Create HDBSCAN clusterer with current config
        clusterer = hdbscan.HDBSCAN(
            min_cluster_size=self.config.min_cluster_size,
            min_samples=self.config.min_samples,
            metric=self.config.metric,
            cluster_selection_method=self.config.cluster_selection_method,
            cluster_selection_epsilon=self.config.cluster_selection_epsilon,
            algorithm=self.config.algorithm,
            core_dist_n_jobs=self.config.core_dist_n_jobs
        )
        
        # Perform clustering
        cluster_labels = clusterer.fit_predict(embeddings_array)
        
        # Analyze embeddings
        stats = self.analyze_embeddings(embeddings_array)
        
        # Add clustering statistics
        stats.processing_time = perf_counter() - start_time
        stats.n_clusters = len(set(cluster_labels[cluster_labels != -1]))
        stats.n_noise = sum(cluster_labels == -1)
        
        if stats.n_clusters > 0:
            stats.cluster_sizes = [int(sum(cluster_labels == i)) for i in range(stats.n_clusters)]
        
        return cluster_labels, stats
    
    def print_summary(self, stats: ClusteringStats, n_docs: int):
        """Print clustering summary to stderr"""
        print(f"\n[SUMMARY] Clustering completed in {stats.processing_time:.2f}s", file=sys.stderr)
        print(f"[SUMMARY] Documents processed: {n_docs}", file=sys.stderr)
        print(f"[SUMMARY] Clusters found: {stats.n_clusters}", file=sys.stderr)
        print(f"[SUMMARY] Noise points: {stats.n_noise}", file=sys.stderr)
        print(f"[SUMMARY] Avg distance between docs: {stats.avg_distance:.4f}", file=sys.stderr)
        
        if stats.cluster_sizes:
            print(f"[SUMMARY] Cluster sizes: {stats.cluster_sizes}", file=sys.stderr)

def main():
    try:
        print(f"[INFO] Starting clustering process...", file=sys.stderr)
        
        # Load embeddings
        with open(sys.argv[1], 'r') as f:
            embeddings = json.load(f)
            
        n_docs = len(embeddings)
        embeddings_array = np.array(embeddings, dtype=np.float32)
        
        # Create config with default or custom parameters
        config = ClusteringConfig(
            min_cluster_size=min(3, n_docs),
            min_samples=2
        )
        
        # Initialize clusterer
        clusterer = DocumentClusterer(config)
        
        # Perform initial clustering
        print(f"[INFO] Performing clustering...", file=sys.stderr)
        cluster_labels, stats = clusterer.perform_clustering(embeddings_array)
        
        # If no clusters found, try with relaxed parameters
        if stats.n_clusters == 0 and n_docs >= 2:
            print(f"[INFO] Retrying with relaxed parameters...", file=sys.stderr)
            clusterer.config.min_cluster_size = 2
            cluster_labels, stats = clusterer.perform_clustering(embeddings_array)
        
        # Print summary
        clusterer.print_summary(stats, n_docs)
        
        # Output results
        print(json.dumps(cluster_labels.tolist()))

    except Exception as e:
        print(f"[ERROR] {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()