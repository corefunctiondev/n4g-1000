import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DjSet() {
  const [currentSet, setCurrentSet] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSets, setRecordedSets] = useState([]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Navigation Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
              ← Back to CDJ
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white">DJ Set Studio</h1>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={isRecording ? "destructive" : "default"}
            onClick={() => setIsRecording(!isRecording)}
            className={isRecording ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
          >
            {isRecording ? "⏹ Stop Recording" : "⏺ Start Recording"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Set Panel */}
        <Card className="lg:col-span-2 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              🎧 Current Set
              {isRecording && <span className="text-red-400 text-sm animate-pulse">● REC</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentSet ? (
              <div className="space-y-4">
                {/* Set Info */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">Set Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Duration:</span>
                      <div className="text-white font-mono">00:00:00</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Tracks Played:</span>
                      <div className="text-white">0</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Average BPM:</span>
                      <div className="text-white">128.0</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Key:</span>
                      <div className="text-white">C Major</div>
                    </div>
                  </div>
                </div>

                {/* Track History */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">Track History</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <div className="text-gray-400 text-sm">No tracks played yet</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">No active set</div>
                <Button 
                  onClick={() => setCurrentSet({})}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Start New Set
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">📊 Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Sets:</span>
                <span className="text-white">{recordedSets.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Time:</span>
                <span className="text-white">0h 0m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Favorite Genre:</span>
                <span className="text-white">Electronic</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Sets */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">🎵 Recent Sets</CardTitle>
            </CardHeader>
            <CardContent>
              {recordedSets.length > 0 ? (
                <div className="space-y-2">
                  {recordedSets.map((set, index) => (
                    <div key={index} className="bg-gray-700 p-3 rounded cursor-pointer hover:bg-gray-600">
                      <div className="text-white font-medium">{set.name}</div>
                      <div className="text-gray-400 text-sm">{set.duration} • {set.tracks} tracks</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-sm">No recorded sets yet</div>
              )}
            </CardContent>
          </Card>

          {/* Set Actions */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">⚙️ Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full border-gray-600 text-white hover:bg-gray-700">
                Export Current Set
              </Button>
              <Button variant="outline" className="w-full border-gray-600 text-white hover:bg-gray-700">
                Save as Playlist
              </Button>
              <Button variant="outline" className="w-full border-gray-600 text-white hover:bg-gray-700">
                Share Set
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Set History Table */}
      <Card className="mt-6 bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">📚 Set History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-2 text-gray-400">Date</th>
                  <th className="text-left py-2 text-gray-400">Name</th>
                  <th className="text-left py-2 text-gray-400">Duration</th>
                  <th className="text-left py-2 text-gray-400">Tracks</th>
                  <th className="text-left py-2 text-gray-400">Genre</th>
                  <th className="text-left py-2 text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recordedSets.length > 0 ? (
                  recordedSets.map((set, index) => (
                    <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                      <td className="py-2 text-gray-300">{set.date}</td>
                      <td className="py-2 text-white">{set.name}</td>
                      <td className="py-2 text-gray-300">{set.duration}</td>
                      <td className="py-2 text-gray-300">{set.tracks}</td>
                      <td className="py-2 text-gray-300">{set.genre}</td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="text-xs border-gray-600 text-white hover:bg-gray-600">
                            Play
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs border-gray-600 text-white hover:bg-gray-600">
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No sets recorded yet. Start your first set to see it here!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}