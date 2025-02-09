import TorrentSearchApi from "torrent-search-api";

export interface ISearchService {
    /**
     * Finds torrents for a given movie name using TorrentSearchApi.
     *
     * This method searches for video torrents related to the provided movie name
     * and returns a list of torrents with their metadata.
     *
     * @param movieName - The name of the movie to search for torrents.
     * @returns A promise that resolves with an object containing the movie name,
     *          an array of torrents, and the number of torrents found.
     * @throws NotFoundException - If no torrents are found for the given movie.
     * @throws InternalServerErrorException - If an error occurs during the search.
     */
    findAll(movieName: string): Promise<{
        movieName: string;
        torrents: TorrentSearchApi.Torrent[];
        torrentsCount: number;
    }>;
}
